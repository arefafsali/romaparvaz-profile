import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { profilePoint } from "../../Common/Metadata/profilePointMetadata";
import { PointRulesManager } from "./PointRulesManager"
import { UsersManager } from "./UsersManager"
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { PointTypesController } from "../../Controllers/PointTypesController";
import { PointTypesManager } from "./PointTypesManager";
import { IncomesManager } from "./IncomesManager";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";

var Sequelize = require("sequelize");
var Op = Sequelize.Op;

const derikValue = 10000;

export class ProfilePointsManager extends BaseRepository<profilePoint> {
  constructor() {
    super("profilePoints");

    //Point service to delete pending points
    setInterval(this.deleteBlockedPoints, 60 * 1000, this)
  }
  /**
   * 
   * @param {Number} profileId 
   * @param page_number 
   * @param items_per_page 
   * @param obj filter
   * @param obj sort
   */
  getByProfileId(profileId: number, page_number: number, items_per_page: number, filter: any = {}, sort: any = {}) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "POST"
    }
    let orderArr = [];
    Object.keys(sort).map(key => sort[key] = sort[key] === "asc" ? orderArr.push([key, "ASC"]) : orderArr.push([key, "DESC"]))
    let query: any = {
      profileId
    }
    if (filter.id) {
      query = {
        ...query,
        id: filter.id
      };
    }
    if (filter.subjectId) {
      if (filter.subjectId == -1) // -1 is reserved for having bookingId, others are pointTypeId
        query = {
          ...query,
          bookingId: { [Op.ne]: null }
        };
      else
        query = {
          ...query,
          pointTypeId: filter.subjectId
        };
    }
    if (filter.point) {
      if (filter.point == '+')
        query = {
          ...query,
          point: { [Op.gte]: 0 }
        };
      if (filter.point == '-')
        query = {
          ...query,
          point: { [Op.lte]: 0 }
        };
    }
    if (filter.startDate || filter.endDate) {
      let partQuery: any = {}
      if (filter.startDate)
        partQuery = { ...partQuery, [Op.gte]: filter.startDate + "T00:00:00Z" };
      if (filter.endDate)
        partQuery = { ...partQuery, [Op.lte]: filter.endDate + "T23:59:59Z" };
      query = {
        ...query, createdAt: partQuery
      }
    }
    return new Promise((resolve, reject) => {
      this.findAndCountAll({
        where: query,
        include: [
          {
            model: DataAccess.Models["profiles"]
          },
          {
            model: DataAccess.Models["pointTypes"]
          },
          {
            model: DataAccess.Models["pointRules"]
          }
        ],
        offset:
          parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]]
      })
        .then((result: any) => {
          let initialValue = 0;
          let total_points = result.rows.reduce(
            (total, currentValue) => total + currentValue.point,
            initialValue
          );
          result.totalPoints = total_points;
          resolve(result);
        })
        .catch(err => {
          console.log(err)
          RejectHandler(reject, err)
        });
    });
  }

  /**
     * @param {Array} id_list with body like :[1,2,3,4,5,...]        **/
  getMe(loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getMe",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          profileId: loggedInUser.profileId
        }
      })
        .then((result: any) => {
          let initialValue = 0;
          let total_points = result.reduce((total, currentValue) => total + currentValue.point, initialValue);
          result.totalPoints = total_points;
          resolve(result);
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  /**
   * 
   * @param {Number} profileId 
   * @param {Number} commissionTypeCode 
   * @param {Boolean} isUnique 
   */
  insertPointForAction(profileId: number, pointTypeId: number, isUnique: boolean, bookingId?: string) {
    this.referrerOption = {
      user: null,
      apiName: "insertPointForAction",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let pointRuleMgm = new PointRulesManager();
      pointRuleMgm.getByType(pointTypeId).then((pointRule_result: Object[]) => {
        if (pointRule_result && pointRule_result.length > 0) {
          pointRule_result = pointRule_result[0]["dataValues"];
          this.find({
            where: {
              pointRuleId: pointRule_result["id"],
              bookingId: (bookingId ? bookingId : null),
              profileId
            }
          }).then((result: Object[]) => {
            if (result) {
              if ((isUnique && result.length == 0) || !isUnique) {
                let profile_point = new profilePoint();
                profile_point.point = pointRule_result["point"];
                profile_point.profileId = profileId;
                profile_point.pointTypeId = pointTypeId;
                profile_point.pointRuleId = pointRule_result["id"];
                profile_point.bookingId = (bookingId ? bookingId : null);
                this.create(profile_point)
                  .then(result => {
                    resolve(true);
                  })
                  .catch(err =>
                    RejectHandler(reject, err));
              }
              else resolve(false)
            }
            else resolve(false)
          }).catch(err =>
            RejectHandler(reject, err));
        }
        else
          resolve(false);
      }).catch(err =>
        RejectHandler(reject, err));
    });
  }

  blockPointForBooking(item: any) {
    this.referrerOption = {
      user: item.profileId,
      apiName: "booking_block",
      apiType: "POST"
    }
    item.amount = item.amount / derikValue;
    return new Promise((resolve, reject) => {
      let newPoint = new profilePoint();
      newPoint.id = 0;
      newPoint.point = -1 * item.amount;
      newPoint.bookingId = item.bookingId;
      newPoint.profileId = item.profileId;
      newPoint.pointRuleId = null
      let blockedAmount = item.amount;
      (new PointTypesManager()).getByCode("7")
        .then((type_result: any) => {
          newPoint.pointTypeId = type_result[0].id;
          return DataAccess.ModelInstance.transaction((t) => {
            return DataAccess.ModelInstance.query(
              `DELETE FROM "public"."profilePoints" 
            WHERE "profilePoints"."bookingId"='${item.bookingId}' AND "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='7')`,
              {
                transaction: t,
                type: Sequelize.QueryTypes.UPDATE
              }
            )
              .then(update_result => {
                return DataAccess.ModelInstance.query(
                  `SELECT COALESCE("sum"("profilePoints".point),0) AS netamount FROM "profilePoints" WHERE "profilePoints"."profileId"=${item.profileId}`,
                  {
                    transaction: t,
                    type: Sequelize.QueryTypes.SELECT
                  }
                )
              })
              .then(point_result => {
                if (point_result[0].netamount <= 0)
                  throw new Error("Point net amount is zero");
                else if (item.amount > point_result[0].netamount) {
                  newPoint.point = -1 * point_result[0].netamount;
                  blockedAmount = point_result[0].netamount;
                  return DataAccess.Models.profilePoints.create(newPoint, { transaction: t });
                }
                else
                  return DataAccess.Models.profilePoints.create(newPoint, { transaction: t });
              });
          })
        })
        .then(result => {
          // this.recalculatePoint(item.profileId);
          resolve(blockedAmount * derikValue)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  payPointForBooking(item: any) {
    this.referrerOption = {
      user: item.profileId,
      apiName: "booking_pay",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let paidAmount = 0;
      let pointId = 0;
      DataAccess.ModelInstance.transaction((t) => {
        return DataAccess.ModelInstance.query(
          `UPDATE "public"."profilePoints" SET "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='6') 
            WHERE "profilePoints"."bookingId"='${item.bookingId}' AND "profilePoints"."profileId"=${item.profileId}
            AND "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='7')`,
          // AND points."amount"='${-1 * item.amount}'
          {
            transaction: t,
            type: Sequelize.QueryTypes.UPDATE
          }
        )
          .then(update_result => {
            return DataAccess.ModelInstance.query(
              `SELECT "profilePoints".point AS paidamount, "profilePoints"."id" FROM "profilePoints"
              WHERE "profilePoints"."bookingId"='${item.bookingId}' AND "profilePoints"."profileId"=${item.profileId}
              AND "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='6')`,
              // AND points."amount"='${-1 * item.amount}' 
              {
                transaction: t,
                type: Sequelize.QueryTypes.SELECT
              }
            )
          })
          .then(point_result => {
            if (point_result.length == 0) {
              // throw new Error("Point payment error");
              pointId = undefined;
              paidAmount = 0;
              return Promise.resolve()
            }
            else {
              pointId = point_result[0].id;
              paidAmount = point_result[0].paidamount;
              return Promise.resolve()
            }
          });
      })
        .then(result => {
          // this.recalculatePoint(item.profileId);
          resolve({ id: pointId, amount: paidAmount * derikValue })
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  unBlockPointForBooking(bookingId: string, profileId: number) {
    this.referrerOption = {
      user: profileId,
      apiName: "booking_unblock",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.transaction((t) => {
        return DataAccess.ModelInstance.query(
          `DELETE FROM "public"."profilePoints" 
          WHERE "profilePoints"."bookingId"='${bookingId}' AND "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='7')`,
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
          // this.recalculatePoint(profileId);
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  private deleteBlockedPoints(that) {
    this.referrerOption = {

      apiName: "internal",
      apiType: "DELETE"
    }
    let profileIdList = [];
    let tempDate = new Date();
    tempDate.setMinutes(tempDate.getMinutes() - parseInt(process.env.CREDIT_WALLET_BLOCK_TIMEOUT));
    DataAccess.ModelInstance.transaction((t) => {
      return DataAccess.ModelInstance.query(
        `SELECT DISTINCT "profilePoints"."profileId" FROM "profilePoints" WHERE "profilePoints"."createdAt"<'${tempDate.toISOString()}' 
        AND "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='7')`,
        {
          transaction: t,
          type: Sequelize.QueryTypes.SELECT
        }
      )
        .then(result => {
          profileIdList = Array.from(new Set(result.map(el => el.profileId)))
          return DataAccess.ModelInstance.query(
            `DELETE FROM "public"."profilePoints" 
            WHERE "profilePoints"."createdAt"<'${tempDate.toISOString()}' AND "pointTypeId" = (SELECT id FROM "pointTypes" WHERE code='7')`,
            {
              transaction: t,
              type: Sequelize.QueryTypes.UPDATE
            }
          )
        })
    })
      .then(result => {
        // profileIdList.forEach(id => that.recalculateWallet(id))
      })
      .catch(err => { console.log("point service", err) })
  }

  /*
  it calculates all points history 
  */
  calculatePointStatus(profileId: number) {
    this.referrerOption = {
      user: profileId,
      apiName: "calculatePointStatus",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          profileId
        }
      })
        .then((result: any) => {

          let initialValue = 0;
          let state: any = {
            totalPoints: result.reduce((total, currentValue) => total + currentValue.point, initialValue),
            collectedPoints: result.reduce((total, currentValue) => currentValue.point > 0 ? total + currentValue.point : total + 0, initialValue),
            spentPoints: result.reduce((total, currentValue) => currentValue.point < 0 ? total + currentValue.point : total + 0, initialValue),
          };
          ExternalRequest.syncPostRequest(`${process.env.MAIN_URL}withdraw_request/me_pending/`,
            {
              profileId,
              withdrawType: 2
            })
            .then((pendingPoints: any) => {
              state.pendingPoints = pendingPoints.payload.data.pendingAmount;
              resolve(state);
            }).catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  /*
  it manages a point transfer between 2 profileId :
  STEP 1: Check second Password
  STEP 2: Check current point status, to if there is enough point for transaction 
  STEP 3: Calculates the amount of wage (each transaction costs some wage, based on PointRules)
  STEP 4: Batch 3 insert into Profile Points (bardasht, variz, karmozd) : 1-for sender a negative amount-wage 2-for sender a negative wage 3-for reciever a positive amount-wage 
  STEP 5: Insert wage into Income
  STEP 6: Recheck current point status (for output)
  STEP 7: Return { true, {new point status}}
  */
  transferPoints(
    pointAmount: number,
    senderProfileId: number,
    recieverProfileId: number,
    secondPassword: string) {

    this.referrerOption = {
      user: senderProfileId,
      apiName: "transfer",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      if (senderProfileId == recieverProfileId)
        RejectHandler(reject, {}, "sender is the same as reciever!")
      else {
        //STEP 1
        (new UsersManager()).checkSecondPassword(senderProfileId, secondPassword)
          .then((user_result: any) => {
            //STEP 2
            this.calculatePointStatus(senderProfileId)
              .then((pointStatus_result: any) => {
                //STEP 3
                (new PointRulesManager).getTransactionWage(pointAmount)
                  .then((wage_result: any) => {
                    if (!wage_result.wage)
                      RejectHandler(reject, {})
                    else {
                      pointAmount = pointAmount - wage_result.wage
                      if (pointAmount <= 0 || pointStatus_result.totalPoints - pointStatus_result.pendingPoints < pointAmount)
                        RejectHandler(reject, { pointStatus_result }, "Not enough!", HTTPStatusCode.NotAcceptable)
                      else {
                        let array_profilePoint = []
                        let profile_point = new profilePoint();
                        profile_point.point = -1 * pointAmount
                        profile_point.profileId = senderProfileId;
                        profile_point.pointTypeId = 10;
                        profile_point.pointRuleId = wage_result.PointRules.id
                        profile_point.bookingId = null
                        array_profilePoint.push(profile_point)

                        profile_point = new profilePoint();
                        profile_point.point = -1 * wage_result.wage
                        profile_point.profileId = senderProfileId;
                        profile_point.pointTypeId = 11; // 11 for point transfer comission wage
                        profile_point.pointRuleId = wage_result.PointRules.id
                        profile_point.bookingId = null
                        array_profilePoint.push(profile_point)

                        profile_point = new profilePoint();
                        profile_point.point = pointAmount
                        profile_point.profileId = recieverProfileId;
                        profile_point.pointTypeId = 10;
                        profile_point.pointRuleId = wage_result.PointRules.id
                        profile_point.bookingId = null
                        array_profilePoint.push(profile_point)

                        //STEP 4
                        this.createBatch(array_profilePoint)
                          .then((batch_result: any) => {
                            if (batch_result.length != 3 || !batch_result[0].id || !batch_result[1].id || !batch_result[2].id)
                              RejectHandler(reject, {})
                            else {
                              let profilePointId_wage = batch_result.find(item => item.pointTypeId == 11).id;
                              //STEP 5
                              (new IncomesManager).insertPointTransferWage(profilePointId_wage, wage_result.wage * derikValue)
                                .then((income_result) => {
                                  let final: any = { result: true }
                                  //STEP 6
                                  this.calculatePointStatus(senderProfileId)
                                    .then((newStatus_result: any) => {
                                      final = {
                                        ...final,
                                        "PointStatus": newStatus_result
                                      }
                                      //STEP 7
                                      resolve(final)
                                    })
                                    .catch(err => {
                                      console.log(err);
                                      resolve(final)
                                    });
                                })
                                .catch(err => {
                                  console.log(err);
                                  RejectHandler(reject, err, err.message)
                                });
                            }
                          })
                          .catch(err => RejectHandler(reject, err, err.message));
                      }
                    }
                  })
                  .catch(err => RejectHandler(reject, err, err.message));
              })
              .catch(err => RejectHandler(reject, err, err.message));
          })
          .catch(err => RejectHandler(reject, err, err.message));
      }
    })
  }

  withdraw(pointAmount: number, senderProfileId: number) {
    this.referrerOption = {
      user: senderProfileId,
      apiName: "profile-Point/withdraw",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let profile_point = new profilePoint();
      profile_point.point = -1 * pointAmount
      profile_point.profileId = senderProfileId;
      profile_point.pointTypeId = 12; // for withdraing by cash
      profile_point.pointRuleId = null
      profile_point.bookingId = null
      this.create(profile_point)
        .then((result: any) => {
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })

  }

}
Object.seal(ProfilePointsManager);

