var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { paymentResponse } from "../../Common/Metadata/paymentResponseMetadata";
import { walletAmount } from "../../Common/Metadata/profileMetadata";
import { wallet } from "../../Common/Metadata/walletMetadata";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { RejectHandler } from "../../Repositories/Utility/ActionResult";
import { ProfilesManager } from "./ProfilesManager";
import { WalletStatusesManager } from "./WalletStatusesManager";
import DataAccess = require("../../Repositories/Base/DataAccess");
export class WalletsManager extends BaseRepository<wallet> {
  constructor() {
    super("wallets");

    //Wallet service to delete pending wallets
    setInterval(this.cancelBlockedWallets, 60 * 1000, this)
  }

  chargeWallet(profileId: number, userId: number, item: wallet) {
    return new Promise<wallet>((resolve, reject) => {
      let moneyUnit: any;
      let newWallet = new wallet();
      newWallet.id = 0;
      newWallet.amount = item.amount;
      newWallet.bookingId = null;
      newWallet.currencyId = item.currencyId;
      newWallet.description = item.description;
      newWallet.guid = undefined;
      newWallet.paymentData = null;
      newWallet.profileId = profileId;
      newWallet.userId = userId;
      ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + item.currencyId)
        .then((moneyUnit_result: any) => {
          moneyUnit = moneyUnit_result.payload.data;
          if (moneyUnit)
            return (new WalletStatusesManager()).findByCode("1")
          else
            RejectHandler(reject, null, "The currencyId does not exist")
        })
        .then(status_result => {
          newWallet.walletStatusId = status_result.id;
          return this.create(newWallet)
        })
        .then((result: wallet) => resolve(result))
        .catch(err => RejectHandler(reject, err));
    })
  }

  chargeWalletCancelledBooking(item: wallet) {
    return new Promise<wallet>((resolve, reject) => {
      let moneyUnit: any;
      let newWallet = new wallet();
      newWallet.id = 0;
      newWallet.amount = item.amount;
      newWallet.bookingId = null; // TODO: should i insert booking id or not
      newWallet.currencyId = item.currencyId;
      newWallet.description = item.description;
      newWallet.guid = undefined;
      newWallet.paymentData = null;
      newWallet.profileId = item.profileId;
      newWallet.userId = item.userId;
      (new WalletStatusesManager()).findByCode("2")
        .then(status_result => {
          newWallet.walletStatusId = status_result.id;
          return this.create(newWallet)
        })
        .then((result: wallet) => resolve(result))
        .catch(err => RejectHandler(reject, err));
    })
  }

  failedPayment(guid: string, paymentData: paymentResponse) {
    let wallet: wallet;
    return new Promise((resolve, reject) => {
      this.find({
        where: { guid },
        include: [
          {
            model: DataAccess.Models["walletStatuses"],
            as: "walletStatus"
          }
        ]
      })
        .then((result: any[]) => {
          wallet = result[0].dataValues;
          if (result[0].walletStatus.code == "1")
            return (new WalletStatusesManager()).findByCode("3")
          else
            RejectHandler(reject, null, "This wallet status cannot be changed");
        })
        .then(status_result => {
          wallet.walletStatusId = status_result.id;
          return this.update(wallet)
        })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err));
    })
  }

  successPayment(guid: string, paymentData: paymentResponse) {
    let wallet: any;
    let finalResult;
    return new Promise((resolve, reject) => {
      this.checkNewPaymentRefId(paymentData.referenceId)
        .then(refIdResult => {
          if (refIdResult)
            return this.find({
              where: { guid },
              include: [
                {
                  model: DataAccess.Models["walletStatuses"],
                  as: "walletStatus"
                },
                {
                  model: DataAccess.Models["users"],
                  as: "user"
                },
                {
                  model: DataAccess.Models["profiles"],
                  as: "profile",
                  include: [
                    {
                      model: DataAccess.Models["users"],
                      as: "creator"
                    }
                  ]
                }
              ]
            })
          else
            RejectHandler(reject, null, "Payment Ref ID already used");
        })
        .then((find_result: any[]) => {
          wallet = find_result[0].dataValues;
          if (find_result[0].walletStatus.code == "1")// && wallet.amount == paymentData.verifiedAmount)
            return (new WalletStatusesManager()).findByCode("2")
          else
            RejectHandler(reject, null, "This wallet status cannot be changed");
        })
        .then(status_result => {
          wallet.paymentData = paymentData;
          wallet.walletStatusId = status_result.id;
          return this.update(wallet)
        })
        .then(result => {
          finalResult = result;
          return this.calculateWalletNetAmount(wallet.profileId, wallet.currencyId)
        })
        .then(calc_result => {
          return (new ProfilesManager()).updateWalletAmount(wallet.profileId, calc_result)
        })
        .then(updateProfile_result => this.addMoneyUnitToResult({
          rows: [{
            guid,
            amount: wallet.amount,
            currencyId: wallet.currencyId,
            ownerEmailAddress: wallet.profile.creator ? wallet.profile.creator.userName : wallet.user.userName,
            userEmailAddress: wallet.user.userName
          }]
        }))
        .then((moneyUnit_result: any) => resolve(moneyUnit_result.rows[0]))
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  getWalletHistory(profileId: number, filters: any, page_number: number, items_per_page: number) {
    return new Promise((resolve, reject) => {
      let query: any = {};
      let _orderBy: any = [["createdAt", "DESC"]];

      if (filters.endDate) {
        let tempDate = new Date(filters.endDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        filters.endDate = tempDate.toISOString().substr(0, 10);
      }
      if (filters.walletStatusId)
        query = {
          ...query,
          walletStatusId: filters.walletStatusId,
        }
      if (filters.startDate && filters.endDate)
        query = {
          ...query,
          [Op.and]: [{
            createdAt: { [Op.gte]: filters.startDate }
          },
          {
            createdAt: { [Op.lte]: filters.endDate }
          }]
        }
      else if (filters.startDate)
        query = {
          ...query,
          createdAt: { [Op.gte]: filters.startDate }
        }
      else if (filters.endDate)
        query = {
          ...query,
          createdAt: { [Op.lte]: filters.endDate }
        }
      this.findAndCountAll({
        where: {
          ...query,
          profileId
        },
        order: _orderBy,
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "profile"
          },
          {
            model: DataAccess.Models["users"],
            as: "user"
          },
          {
            model: DataAccess.Models["walletStatuses"],
            as: "walletStatus"
          }
        ]
      })
        .then((result: any) => {
          return this.addBookingToResult(result)
        })
        .then((result: any) => {
          return this.addMoneyUnitToResult(result)
        })
        .then(result => resolve(result))
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  recalculateWallet(profileId: number) {
    let finalResult;
    return new Promise<walletAmount>((resolve, reject) => {
      this.find({ where: { profileId } })
        .then(find_result => {
          if (find_result.length)
            return this.calculateWalletNetAmount(profileId, find_result[0].currencyId)
          else
            // TODO: update this
            return this.calculateWalletNetAmount(profileId, "5c6a7107e8a2a14358df03d3")
        })
        .then(calc_result => {
          finalResult = calc_result;
          return (new ProfilesManager()).updateWalletAmount(profileId, calc_result)
        })
        .then(updateProfile_result => resolve(finalResult))
        .catch(err => RejectHandler(reject, err));
    })
  }

  blockWalletForBooking(item: any) {
    return new Promise((resolve, reject) => {
      let newWallet = new wallet();
      newWallet.id = 0;
      newWallet.amount = -1 * item.amount;
      newWallet.bookingId = item.bookingId;
      newWallet.currencyId = item.currencyId;
      newWallet.description = item.description;
      newWallet.guid = undefined;
      newWallet.paymentData = null;
      newWallet.profileId = item.profileId;
      newWallet.userId = item.userId;
      let blockedAmount = item.amount;
      (new WalletStatusesManager()).findByCode("4")
        .then(status_result => {
          newWallet.walletStatusId = status_result.id;
          return DataAccess.ModelInstance.transaction((t) => {
            return DataAccess.ModelInstance.query(
              `UPDATE "public"."wallets" SET "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='6') 
            WHERE wallets."bookingId"='${item.bookingId}' AND "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='4')`,
              {
                transaction: t,
                type: Sequelize.QueryTypes.UPDATE
              }
            )
              .then(update_result => {
                return DataAccess.ModelInstance.query(
                  `SELECT COALESCE("sum"(wallets.amount),0) AS netamount FROM wallets INNER JOIN "walletStatuses" ON wallets."walletStatusId"="walletStatuses"."id" WHERE wallets."profileId"=${item.profileId} AND "walletStatuses".code IN ('2','4','5')`,
                  {
                    transaction: t,
                    type: Sequelize.QueryTypes.SELECT
                  }
                )
              })
              .then(wallet_result => {
                if (wallet_result[0].netamount <= 0)
                  throw new Error("Wallet net amount is zero");
                else if (item.amount > wallet_result[0].netamount) {
                  newWallet.amount = -1 * wallet_result[0].netamount;
                  blockedAmount = wallet_result[0].netamount;
                  newWallet.description = "(Partial Payment) " + newWallet.description;
                  return DataAccess.Models.wallets.create(newWallet, { transaction: t });
                }
                else
                  return DataAccess.Models.wallets.create(newWallet, { transaction: t });
              });
          })
        })
        .then(result => {
          this.recalculateWallet(item.profileId);
          resolve(blockedAmount)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  payWalletForBooking(item: any) {
    return new Promise((resolve, reject) => {
      let paidAmount = 0;
      let walletId = 0;
      DataAccess.ModelInstance.transaction((t) => {
        return DataAccess.ModelInstance.query(
          `UPDATE "public"."wallets" SET "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='5') 
            WHERE wallets."bookingId"='${item.bookingId}' AND wallets."profileId"=${item.profileId}
            AND wallets."currencyId"='${item.currencyId}' AND wallets."userId"=${item.userId} AND "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='4')`,
          // AND wallets."amount"='${-1 * item.amount}'
          {
            transaction: t,
            type: Sequelize.QueryTypes.UPDATE
          }
        )
          .then(update_result => {
            return DataAccess.ModelInstance.query(
              `SELECT wallets.amount AS paidamount, wallets."id" FROM wallets INNER JOIN "walletStatuses" ON wallets."walletStatusId"="walletStatuses"."id"
              WHERE wallets."bookingId"='${item.bookingId}' AND wallets."profileId"=${item.profileId}
              AND wallets."currencyId"='${item.currencyId}' AND wallets."userId"=${item.userId} AND "walletStatuses".code IN ('5')`,
              // AND wallets."amount"='${-1 * item.amount}' 
              {
                transaction: t,
                type: Sequelize.QueryTypes.SELECT
              }
            )
          })
          .then(wallet_result => {
            if (wallet_result.length == 0) {
              // throw new Error("Wallet payment error");
              walletId = undefined;
              paidAmount = 0;
              return Promise.resolve()
            }
            else {
              walletId = wallet_result[0].id;
              paidAmount = wallet_result[0].paidamount;
              return Promise.resolve()
            }
          });
      })
        .then(result => {
          this.recalculateWallet(item.profileId);
          resolve({ id: walletId, amount: paidAmount })
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  unBlockWalletForBooking(bookingId: string, profileId: number) {
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.transaction((t) => {
        return DataAccess.ModelInstance.query(
          `UPDATE "public"."wallets" SET "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='6') 
            WHERE wallets."bookingId"='${bookingId}' AND "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='4')`,
          {
            transaction: t,
            type: Sequelize.QueryTypes.UPDATE
          }
        )
          .then(update_result => {
            return Promise.resolve()
          })
      })
        .then(result => {
          this.recalculateWallet(profileId);
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  private calculateWalletNetAmount(profileId: number, currencyId: string) {
    let result = new walletAmount();
    return new Promise<walletAmount>((resolve, reject) => {
      ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + currencyId)
        .then((moneyUnit_result: any) => {
          result.moneyUnit = moneyUnit_result.payload.data;
          return DataAccess.ModelInstance.query(
            `SELECT "sum"(wallets.amount) AS netamount FROM wallets INNER JOIN "walletStatuses" ON wallets."walletStatusId"="walletStatuses"."id" WHERE wallets."profileId"=${profileId} AND "walletStatuses".code IN ('2','4','5')`,
            {
              type: Sequelize.QueryTypes.SELECT
            }
          )
        })
        .then(wallet_result => {
          if (wallet_result[0].netamount) result.remain = wallet_result[0].netamount;
          return DataAccess.ModelInstance.query(
            `SELECT "sum"(wallets.amount) AS blocked FROM wallets INNER JOIN "walletStatuses" ON wallets."walletStatusId"="walletStatuses"."id" WHERE wallets."profileId"=${profileId} AND ("walletStatuses".code = '4')`,
            {
              type: Sequelize.QueryTypes.SELECT
            }
          )
        })
        .then(blocked_result => {
          if (blocked_result[0].blocked) result.blocked = -1 * blocked_result[0].blocked;
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err))
    })
  }

  private checkNewPaymentRefId(paymentRefrenceID: string) {
    return new Promise<boolean>((resolve, reject) => {
      this.find({ where: Sequelize.where(Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('wallets.paymentData'), 'referenceId'), paymentRefrenceID) })
        .then(find_result => {
          if (find_result.length > 0)
            resolve(false)
          else
            resolve(true);
        })
        .catch(err => reject(err))
    })
  }

  private addBookingToResult(result: any) {
    result = JSON.parse(JSON.stringify(result));
    return new Promise((resolve, reject) => {
      let resultCount = 0;
      let resolveResult = () => {
        if (++resultCount == result.rows.length)
          resolve(result)
      }
      if (result.rows.length == 0) resolve(result)
      else
        result.rows.forEach(element => {
          if (element.bookingId)
            ExternalRequest.syncGetRequest(process.env.MAIN_URL + "booking/id/" + element.bookingId)
              .then((booking_result: any) => {
                element.booking = booking_result.payload.data;
                resolveResult();
              })
              .catch(err => RejectHandler(reject, err));
          else
            resolveResult();
        });
    })
  }

  private addMoneyUnitToResult(result: any) {
    result = JSON.parse(JSON.stringify(result));
    return new Promise((resolve, reject) => {
      let resultCount = 0;
      let resolveResult = () => {
        if (++resultCount == result.rows.length)
          resolve(result)
      }
      if (result.rows.length == 0) resolve(result)
      else
        result.rows.forEach(element => {
          if (element.currencyId)
            ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + element.currencyId)
              .then((moneyUnit_result: any) => {
                element.moneyUnit = moneyUnit_result.payload.data;
                resolveResult();
              })
              .catch(err => RejectHandler(reject, err));
          else
            resolveResult();
        });
    })
  }

  private cancelBlockedWallets(that) {
    let profileIdList = [];
    let tempDate = new Date();
    tempDate.setMinutes(tempDate.getMinutes() - parseInt(process.env.CREDIT_WALLET_BLOCK_TIMEOUT));
    DataAccess.ModelInstance.transaction((t) => {
      return DataAccess.ModelInstance.query(
        `SELECT DISTINCT wallets."profileId" FROM wallets INNER JOIN "walletStatuses" ON wallets."walletStatusId"="walletStatuses"."id" WHERE wallets."createdAt"<'${tempDate.toISOString()}' 
        AND "walletStatuses".code ='4'`,
        {
          transaction: t,
          type: Sequelize.QueryTypes.SELECT
        }
      )
        .then(result => {
          profileIdList = Array.from(new Set(result.map(el => el.profileId)))
          return DataAccess.ModelInstance.query(
            `UPDATE "public"."wallets" SET "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='6') 
            WHERE wallets."createdAt"<'${tempDate.toISOString()}' AND "walletStatusId" = (SELECT id FROM "walletStatuses" WHERE code='4')`,
            {
              transaction: t,
              type: Sequelize.QueryTypes.UPDATE
            }
          )
        })
    })
      .then(result => {
        profileIdList.forEach(id => that.recalculateWallet(id))
      })
      .catch(err => { console.log("wallet service", err) })
  }
}
Object.seal(WalletsManager);
