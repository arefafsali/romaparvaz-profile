
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { credit } from "../../Common/Metadata/creditMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler, ResponseHandler } from "../../Repositories/Utility/ActionResult"
import { CreditStatusesManager } from "./CreditStatusesManager";
import { ProfilesManager } from "./ProfilesManager";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import { CreditExpensesManager } from "./CreditExpensesManager";
import { creditAmount } from "../../Common/Metadata/profileMetadata";
import { creditExpense } from "../../Common/Metadata/creditExpenseMetadata";
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";
export class CreditsManager extends BaseRepository<credit> {
  constructor() {
    super("credits");

    // Credit Service to change credit statuses to expired every day @ 00:00:00
    // This service needs to be configured for daytime saving time changes
    // this.updateExpiredCredits()
    // setTimeout(() => {
    //   setInterval(this.updateExpiredCredits, 24 * 1000)
    // }, 1000)
  }

  getByPaging(page_number: number, items_per_page: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.findAndCountAll({
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "profile"
          }
        ],
        order: [[Sequelize.col("credits.createdAt"), "DESC"]]
      })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err));
    });
  }

  getByProfileId(profileId: number, filters: any, page_number: number, items_per_page: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let query: any = {};
      if (filters.createdEndDate) {
        let tempDate = new Date(filters.createdEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        filters.createdEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (filters.expieryEndDate) {
        let tempDate = new Date(filters.expieryEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        filters.expieryEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (filters.creditStatusId)
        query = {
          ...query,
          creditStatusId: filters.creditStatusId,
        }
      if (filters.createdStartDate && filters.createdEndDate && filters.expieryStartDate && filters.expieryEndDate)
        query = {
          ...query,
          [Op.and]: [{
            expireDate: { [Op.gte]: filters.expieryStartDate }
          },
          {
            expireDate: { [Op.lte]: filters.expieryEndDate }
          }, {
            createdAt: { [Op.gte]: filters.createdStartDate }
          },
          {
            createdAt: { [Op.lte]: filters.createdEndDate }
          }]
        }
      else {
        if (filters.createdStartDate && filters.createdEndDate)
          query = {
            ...query,
            [Op.and]: [{
              createdAt: { [Op.gte]: filters.createdStartDate }
            },
            {
              createdAt: { [Op.lte]: filters.createdEndDate }
            }]
          }
        else if (filters.createdStartDate)
          query = {
            ...query,
            createdAt: { [Op.gte]: filters.createdStartDate }
          }
        else if (filters.createdEndDate)
          query = {
            ...query,
            createdAt: { [Op.lte]: filters.createdEndDate }
          }
        if (filters.expieryStartDate && filters.expieryEndDate)
          query = {
            ...query,
            [Op.and]: [{
              expireDate: { [Op.gte]: filters.expieryStartDate }
            },
            {
              expireDate: { [Op.lte]: filters.expieryEndDate }
            }]
          }
        else if (filters.expieryStartDate)
          query = {
            ...query,
            expireDate: { [Op.gte]: filters.expieryStartDate }
          }
        else if (filters.expieryEndDate)
          query = {
            ...query,
            expireDate: { [Op.lte]: filters.expieryEndDate }
          }
      }
      let finalResult;
      this.findAndCountAll({
        where: {
          ...query,
          profileId
        },
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "profile"
          },
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          },
          {
            model: DataAccess.Models["creditExpenses"],
            as: "creditExpenses",
            include: [{
              model: DataAccess.Models["creditStatuses"],
              as: "creditStatus"
            }]
          }
        ],
        order: [[Sequelize.col("credits.createdAt"), "DESC"]]
      })
        .then((result: any) => {
          finalResult = JSON.parse(JSON.stringify(result));
          finalResult.rows.forEach(el => {
            // if (el.creditStatus.code == 1) {
            el.blockedAmount = el.creditExpenses.reduce((p, c) => c.creditStatus.code == 5 ? p + c.amount : p, 0);
            el.remainAmount = el.amount - el.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 ? p + c.amount : p, 0) - el.blockedAmount;
            // }
            // else {
            //   el.remainAmount = 0;
            //   el.blockedAmount = 0;
            // }
            el.hasExpenses = el.creditExpenses.length > 0 ? true : false;
            el.creditExpenses = undefined;
          })
          return this.findAndCountAll({ where: { profileId } })
        })
        .then((count_result: any) => {
          finalResult.count = count_result.count;
          return this.addMoneyUnitToResult(finalResult)
        })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err));
    });
  }

  create(item: credit, operatorId?: number) {
    this.referrerOption = {
      user: operatorId,
      apiName: "create",
      apiType: "POST"
    }
    let moneyUnit: any;
    let finalResult: any;
    item.amount = parseFloat(item.amount.toString());
    return new Promise((resolve, reject) => {
      ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + item.currencyId)
        .then((moneyUnit_result: any) => {
          moneyUnit = moneyUnit_result.payload.data;
          if (moneyUnit)
            return this.find({
              where: {
                [Op.and]: [
                  Sequelize.where(Sequelize.col('credits.profileId'), item.profileId),
                  Sequelize.where(Sequelize.col('creditStatus.code'), '1')
                ]
              },
              include: [
                {
                  model: DataAccess.Models["creditStatuses"],
                  as: "creditStatus"
                }
              ]
            })
          else
            RejectHandler(reject, null, "The currencyId does not exist")
        })
        .then(find_result => {
          if (find_result.length > 0)
            RejectHandler(reject, null, "There is already an active credit for this profile")
          else
            return (new ProfilesManager).findOne(item.profileId)
        })
        .then((profile_result: any[]) => {
          if (profile_result[0] && profile_result[0].isApproved) {
            return (new CreditStatusesManager).findByCode("1")
          }
          else
            RejectHandler(reject, null, "This profile is not eligible for a credit")
        })
        .then(status_result => {
          item.creditStatusId = status_result.id;
          item.operatorId = operatorId;
          let tempDate = new Date();
          tempDate.setHours(0, -1 * tempDate.getTimezoneOffset(), 0, 0);
          tempDate.setDate(tempDate.getDate() + item.period)
          tempDate = new Date(tempDate.toISOString().substr(0, 10));
          item.expireDate = tempDate;
          return super.create(item)
        })
        .then(result => {
          finalResult = result;
          return (new ProfilesManager).updateCreditAmount(item.profileId, { total: item.amount, remain: item.amount, blocked: 0, moneyUnit: moneyUnit })
        })
        .then(updateProfile_result => {
          resolve(finalResult)
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  createAndDeactivateZeroCredit(item: credit, operatorId?: number) {
    this.referrerOption = {
      user: operatorId,
      apiName: "createAndDeactivateZeroCredit",
      apiType: "POST"
    }
    let currentCredit: credit;
    item.amount = parseFloat(item.amount.toString());
    return new Promise((resolve, reject) => {
      this.findProfileActiveCredit(item.profileId)
        .then(credits => {
          currentCredit = credits[0]
          if (credits.length == 0)
            RejectHandler(reject, null, "There is no active credit for this profile")
          else
            return this.recalculateCredit(item.profileId)
        })
        .then(recalculate_result => {
          if (recalculate_result.remain != 0)
            RejectHandler(reject, null, "The current active credit has remain amount")
          else if (recalculate_result.blocked != 0)
            RejectHandler(reject, null, "The current active credit has blocked amount, wait until the blocked amount become clear")
          else
            return this.expireCredit(currentCredit.id)
        })
        .then(expireResult => {
          return this.create(item, operatorId)
        })
        .then(create_result => {
          resolve(create_result)
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  update(item: credit) {
    let finalResult;
    let moneyUnit;
    let credit: credit;
    let creditAmount;
    item.amount = parseFloat(item.amount.toString());
    return new Promise((resolve, reject) => {
      this.findOne(item.id)
        .then((credit_result: any) => {
          if (!credit_result[0])
            RejectHandler(reject, null, "There is no record with this id")
          credit = credit_result[0].dataValues;
          return this.find({
            where: {
              [Op.and]: [
                Sequelize.where(Sequelize.col('credits.profileId'), credit.profileId),
                Sequelize.where(Sequelize.col('creditStatus.code'), '1')
              ]
            },
            include: [
              {
                model: DataAccess.Models["creditStatuses"],
                as: "creditStatus"
              }
            ]
          })
        })
        .then(find_result => {
          if (find_result.length > 0 && item.creditStatusId == 1 && item.creditStatusId != credit.creditStatusId)
            RejectHandler(reject, null, "There is already an active credit for this profile")
          else {
            if (item.creditStatusId) credit.creditStatusId = item.creditStatusId;
            if (item.expireDate) credit.expireDate = item.expireDate
            if (item.period) credit.period = item.period
            return (new CreditExpensesManager).calculateCreditExpensesSummary(credit.id)
          }
        }).then(expensesSummary_result => {
          if (item.amount && item.amount < (expensesSummary_result.blocked + expensesSummary_result.expenses))
            RejectHandler(reject, null, "The amount cannot be less than the sum of expenses")
          else {
            if (item.amount) credit.amount = item.amount;
            return super.update(credit)
          }
        })
        .then(result => {
          finalResult = result;
          return ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + credit.currencyId);
        })
        .then((moneyUnit_result: any) => {
          moneyUnit = moneyUnit_result.payload.data;
          return this.find({
            where: {
              [Op.and]: [
                Sequelize.where(Sequelize.col('credits.profileId'), credit.profileId),
                Sequelize.where(Sequelize.col('creditStatus.code'), '1')
              ]
            },
            include: [
              {
                model: DataAccess.Models["creditStatuses"],
                as: "creditStatus"
              }
            ]
          })
        })
        .then(find_result => {
          creditAmount = 0;
          if (find_result.length > 0)
            creditAmount = find_result[0].amount;
          return (new CreditExpensesManager).calculateCreditExpensesSummary(find_result[0] ? find_result[0].id : 0)
        })
        .then(expensesSummary_result => {
          return (new ProfilesManager).updateCreditAmount(credit.profileId, {
            total: creditAmount == 0 ? 0 : (creditAmount),
            remain: creditAmount == 0 ? 0 : (creditAmount - expensesSummary_result.expenses - expensesSummary_result.blocked),
            blocked: creditAmount == 0 ? 0 : expensesSummary_result.blocked,
            moneyUnit: moneyUnit
          })
        })
        .then(updateProfile_result => resolve(finalResult))
        .catch(err => RejectHandler(reject, err));
    })
  }

  delete(_id: any) {
    let credit: credit;
    let finalResult;
    let moneyUnit;
    let expensesSummary;
    let creditAmount;
    return new Promise((resolve, reject) => {
      this.findOne(_id)
        .then((credit_result: any) => {
          if (!credit_result[0])
            RejectHandler(reject, null, "There is no record with this id")
          credit = credit_result[0].dataValues;
          return (new CreditExpensesManager).calculateCreditExpensesSummary(credit.id)
        })
        .then(creditExpenses_result => {
          expensesSummary = creditExpenses_result
          if (creditExpenses_result.expenses > 0 || creditExpenses_result.blocked > 0)
            RejectHandler(reject, null, "This record cannot be deleted as there is expenses from this credit")
          else
            return super.delete(_id);
        })
        .then(result => {
          finalResult = result;
          return ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + credit.currencyId);
        })
        .then((moneyUnit_result: any) => {
          moneyUnit = moneyUnit_result.payload.data;
          return this.find({
            where: {
              [Op.and]: [
                Sequelize.where(Sequelize.col('credits.profileId'), credit.profileId),
                Sequelize.where(Sequelize.col('creditStatus.code'), '1')
              ]
            },
            include: [
              {
                model: DataAccess.Models["creditStatuses"],
                as: "creditStatus"
              }
            ]
          })
        })
        .then(find_result => {
          creditAmount = 0;
          let creditId = 0;
          if (find_result.length > 0) {
            creditAmount = find_result[0].amount;
            creditId = find_result[0].id;
          }
          return (new CreditExpensesManager).calculateCreditExpensesSummary(creditId)
        })
        .then(expensesSummary_result => {
          return (new ProfilesManager).updateCreditAmount(credit.profileId, {
            total: creditAmount == 0 ? 0 : (creditAmount),
            remain: creditAmount == 0 ? 0 : (creditAmount - expensesSummary_result.expenses - expensesSummary_result.blocked),
            blocked: creditAmount == 0 ? 0 : expensesSummary_result.blocked,
            moneyUnit: moneyUnit
          })
        })
        .then(result => resolve(result))
        .catch(err => {
          console.log(err);
          if (err.name == "SequelizeForeignKeyConstraintError") {
            RejectHandler(reject, err, "Cannot be deleted due to dependencies", HTTPStatusCode.FailedDependency);
          }
          else
            RejectHandler(reject, err)
        });
    })
  }

  recalculateCredit(profileId: number) {
    let finalResult;
    return new Promise<creditAmount>((resolve, reject) => {
      this.findProfileActiveCredit(profileId)
        .then(find_result => {
          return this.calculateCreditAmount(profileId, find_result[0])
          // TODO: update this
          // return this.calculateCreditAmount(profileId, find_result[0], "5c6a7107e8a2a14358df03d3")
        })
        .then(calc_result => {
          finalResult = calc_result;
          return (new ProfilesManager()).updateCreditAmount(profileId, calc_result)
        })
        .then(updateProfile_result => resolve(finalResult))
        .catch(err => RejectHandler(reject, err));
    })
  }

  getProfileAllCreditsSummary(profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getProfileAllCreditsSummary",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: { profileId },
        include: [
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          },
          {
            model: DataAccess.Models["creditExpenses"],
            as: "creditExpenses",
            include: [{
              model: DataAccess.Models["creditStatuses"],
              as: "creditStatus"
            }]
          }
        ]
      })
        .then((result: any[]) => {
          return this.addMoneyUnitToResult({ rows: result })
        })
        .then((result: any) => {
          let finalResult = {
            total: 0,
            used: 0,
            remain: 0,
            currency: result.rows[0] ? result.rows[0].currency : null
          }
          finalResult.total = result.rows.reduce((p, c) => p + c.amount, 0);
          finalResult.used = result.rows.reduce((p, c) => p + c.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 ? p + c.amount : p, 0), 0);
          finalResult.remain = result.rows.filter(el => el.creditStatus.code == 1).map(el => el.amount - el.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 || c.creditStatus.code == 5 ? p + c.amount : p, 0))[0];
          if (!finalResult.remain)
            finalResult.remain = 0;
          resolve(finalResult);
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  getCreditExpensesByCreditId(profileId: number, creditId: number, page_number: number, items_per_page: number) {
    return new Promise((resolve, reject) => {
      this.findAndCountAll({
        where: {
          [Op.and]: [
            Sequelize.where(Sequelize.col('credits.id'), creditId),
            {
              [Op.or]: [
                Sequelize.where(Sequelize.col('creditExpenses->creditStatus.code'), '2'),
                Sequelize.where(Sequelize.col('creditExpenses->creditStatus.code'), '5')
              ]
            }
          ]
        },
        order: [Sequelize.col("creditExpenses.createdAt")],
        include: [
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          },
          {
            model: DataAccess.Models["creditExpenses"],
            as: "creditExpenses",
            include: [{
              model: DataAccess.Models["creditStatuses"],
              as: "creditStatus"
            }],
          }
        ]
      })
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result))
          if (result.rows.length == 0 || (result.rows.length > 0 && result.rows[0].profileId != profileId))
            RejectHandler(reject, null, "You do not have access to this record");
          else {
            result.rows[0].creditExpensesCount = result.rows[0].creditExpenses.length;
            result.rows[0].creditExpenses = result.rows[0].creditExpenses.slice(page_number * items_per_page, (page_number + 1) * items_per_page)
            return this.addMoneyUnitToResult(result)
          }
        })
        .then(result => this.addBookingToResult(result))
        .then((result: any) => resolve(result.rows[0]))
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  findProfileActiveCredit(profileId: number) {
    return this.find({
      where: {
        [Op.and]: [
          Sequelize.where(Sequelize.col('credits.profileId'), profileId),
          Sequelize.where(Sequelize.col('creditStatus.code'), '1')
        ]
      },
      include: [
        {
          model: DataAccess.Models["creditStatuses"],
          as: "creditStatus"
        }
      ]
    })
  }

  getActiveCredits(body: any, page_number: number, items_per_page: number) {
    return new Promise((resolve, reject) => {
      let query: any = {
        [Op.and]: [
          Sequelize.where(Sequelize.col('creditStatus.code'), '1')
        ]
      };
      if (body.phrase)
        query = { //TODO: ask Navid 
          ...query,
          [Op.or]: [
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.basicInfo'), 'managerName')), {
              [Op.like]: "%" + body.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'fa')), {
              [Op.like]: "%" + body.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'en')), {
              [Op.like]: "%" + body.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profiles.firstName")), {
              [Op.like]: "%" + body.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profiles.lastName")), {
              [Op.like]: "%" + body.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profiles.email")), {
              [Op.like]: "%" + body.phrase.toLowerCase() + "%"
            }),
          ]
        };
      if (body.businessType) { //TODO: ask Navid 
        if (body.businessType == 1)
          query = {
            ...query,
            "profiles.businessTypeId": { [Op.not]: null },
          }
        if (body.businessType == 2)
          query = {
            ...query,
            businessTypeId: { [Op.eq]: null },
          }
      };
      if (body.createdEndDate) {
        let tempDate = new Date(body.createdEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        body.createdEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (body.expieryEndDate) {
        let tempDate = new Date(body.expieryEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        body.expieryEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (body.creditStatusId)
        query = {
          ...query,
          creditStatusId: body.creditStatusId,
        }
      if (body.createdStartDate && body.createdEndDate && body.expieryStartDate && body.expieryEndDate)
        query = {
          ...query,
          [Op.and]: [{
            expireDate: { [Op.gte]: body.expieryStartDate }
          },
          {
            expireDate: { [Op.lte]: body.expieryEndDate }
          }, {
            createdAt: { [Op.gte]: body.createdStartDate }
          },
          {
            createdAt: { [Op.lte]: body.createdEndDate }
          }]
        }
      else {
        if (body.createdStartDate && body.createdEndDate)
          query = {
            ...query,
            [Op.and]: [{
              createdAt: { [Op.gte]: body.createdStartDate }
            },
            {
              createdAt: { [Op.lte]: body.createdEndDate }
            }]
          }
        else if (body.createdStartDate)
          query = {
            ...query,
            createdAt: { [Op.gte]: body.createdStartDate }
          }
        else if (body.createdEndDate)
          query = {
            ...query,
            createdAt: { [Op.lte]: body.createdEndDate }
          }
        if (body.expieryStartDate && body.expieryEndDate)
          query = {
            ...query,
            [Op.and]: [{
              expireDate: { [Op.gte]: body.expieryStartDate }
            },
            {
              expireDate: { [Op.lte]: body.expieryEndDate }
            }]
          }
        else if (body.expieryStartDate)
          query = {
            ...query,
            expireDate: { [Op.gte]: body.expieryStartDate }
          }
        else if (body.expieryEndDate)
          query = {
            ...query,
            expireDate: { [Op.lte]: body.expieryEndDate }
          }
      }
      this.findAndCountAll({
        where: query,
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "profile",
            include: [
              {
                model: DataAccess.Models["users"],
                as: "creator",
                include: [
                  {
                    model: DataAccess.Models["profiles"],
                    as: "individualProfile"
                  }
                ]
              },
              {
                model: DataAccess.Models["users"],
                as: "operator"
              },
              {
                model: DataAccess.Models["profileTypes"]
              },
              {
                model: DataAccess.Models["businessTypes"]
              },
              {
                model: DataAccess.Models["profileGrades"]
              }
            ]
          },
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          }
        ],
        order: [[Sequelize.col("credits.createdAt"), "DESC"]]
      })
        .then(result => this.addMoneyUnitToResult(result))
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result))
          let resultCount = 0;
          let resolveResult = () => {
            if (++resultCount == result.rows.length)
              resolve(result)
          }
          if (result.rows.length == 0) resolve(result)
          result.rows.forEach(el => {
            this.calculateCreditAmount(el.profileId, el)
              .then(creditSummary => {
                el.remainAmount = creditSummary.remain;
                el.blockedAmount = creditSummary.blocked;
                resolveResult();
              })
              .catch(err => RejectHandler(reject, err));
          })
        })
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  getAllActiveCreditsSummary() {
    this.referrerOption = {
      user: null,
      apiName: "getAllActiveCreditsSummary",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: Sequelize.where(Sequelize.col('creditStatus.code'), '1'),
        include: [
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          },
          {
            model: DataAccess.Models["creditExpenses"],
            as: "creditExpenses",
            include: [{
              model: DataAccess.Models["creditStatuses"],
              as: "creditStatus"
            }]
          }
        ]
      })
        .then((result: any[]) => {
          let finalResult = {
            total: 0.0,
            used: 0.0,
            remain: 0.0,
            count: 0.0
          };
          finalResult.count = result.length;          
          finalResult.total = result.reduce((p, c) => parseFloat(p) + parseFloat(c.amount), 0.0);
          finalResult.used = result.reduce((p, c) => p + c.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 ? parseFloat(p) + parseFloat(c.amount) : p, 0.0), 0.0);
          finalResult.remain = result.map(el => el.amount - el.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 || c.creditStatus.code == 5 ? parseFloat(p) + parseFloat(c.amount) : p, 0.0)).reduce((p, c) => Number(p) + Number(c), 0.0);
          if (!finalResult.remain)
            finalResult.remain = 0.0;
          resolve(finalResult);
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  getPaidOrExpiredCredits(body: any, page_number: number, items_per_page: number) {
    return new Promise((resolve, reject) => {
      let query: any = {};
      if (body.creditStatusCode)
        if (body.creditStatusCode == "3" || body.creditStatusCode == "4")
          query = {
            ...query,
            [Op.or]: [
              Sequelize.where(Sequelize.col('creditStatus.code'), body.creditStatusCode)
            ]
          }
        else
          RejectHandler(reject, null, "Requested status code is wrong")
      else
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(Sequelize.col('creditStatus.code'), '3'),
            Sequelize.where(Sequelize.col('creditStatus.code'), '4')
          ]
        }
      if (body.phrase) //TODO: ask Navid 
        query = {
          [Op.and]: [
            query,
            {
              [Op.or]: [
                Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.basicInfo'), 'managerName')), {
                  [Op.like]: "%" + body.phrase.toLowerCase() + "%"
                }),
                Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'fa')), {
                  [Op.like]: "%" + body.phrase.toLowerCase() + "%"
                }),
                Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'en')), {
                  [Op.like]: "%" + body.phrase.toLowerCase() + "%"
                })
                ,
                Sequelize.where(Sequelize.fn("lower", Sequelize.col("profiles.firstName")), {
                  [Op.like]: "%" + body.phrase.toLowerCase() + "%"
                }),
                Sequelize.where(Sequelize.fn("lower", Sequelize.col("profiles.lastName")), {
                  [Op.like]: "%" + body.phrase.toLowerCase() + "%"
                }),
                Sequelize.where(Sequelize.fn("lower", Sequelize.col("profiles.email")), {
                  [Op.like]: "%" + body.phrase.toLowerCase() + "%"
                }),
              ]
            }]
        };

      if (body.businessType) { //TODO: ask Navid 
        if (body.businessType == 1)
          query = {
            ...query,
            "profiles.businessTypeId": { [Op.not]: null },
          }
        if (body.businessType == 2)
          query = {
            ...query,
            businessTypeId: { [Op.eq]: null },
          }
      };
      if (body.createdEndDate) {
        let tempDate = new Date(body.createdEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        body.createdEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (body.expieryEndDate) {
        let tempDate = new Date(body.expieryEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        body.expieryEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (body.creditStatusId)
        query = {
          ...query,
          creditStatusId: body.creditStatusId,
        }
      if (body.createdStartDate && body.createdEndDate && body.expieryStartDate && body.expieryEndDate)
        query = {
          ...query,
          [Op.and]: [{
            expireDate: { [Op.gte]: body.expieryStartDate }
          },
          {
            expireDate: { [Op.lte]: body.expieryEndDate }
          }, {
            createdAt: { [Op.gte]: body.createdStartDate }
          },
          {
            createdAt: { [Op.lte]: body.createdEndDate }
          }]
        }
      else {
        if (body.createdStartDate && body.createdEndDate)
          query = {
            ...query,
            [Op.and]: [{
              createdAt: { [Op.gte]: body.createdStartDate }
            },
            {
              createdAt: { [Op.lte]: body.createdEndDate }
            }]
          }
        else if (body.createdStartDate)
          query = {
            ...query,
            createdAt: { [Op.gte]: body.createdStartDate }
          }
        else if (body.createdEndDate)
          query = {
            ...query,
            createdAt: { [Op.lte]: body.createdEndDate }
          }
        if (body.expieryStartDate && body.expieryEndDate)
          query = {
            ...query,
            [Op.and]: [{
              expireDate: { [Op.gte]: body.expieryStartDate }
            },
            {
              expireDate: { [Op.lte]: body.expieryEndDate }
            }]
          }
        else if (body.expieryStartDate)
          query = {
            ...query,
            expireDate: { [Op.gte]: body.expieryStartDate }
          }
        else if (body.expieryEndDate)
          query = {
            ...query,
            expireDate: { [Op.lte]: body.expieryEndDate }
          }
      }
      this.findAndCountAll({
        where: query,
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "profile",
            include: [
              {
                model: DataAccess.Models["users"],
                as: "creator",
                include: [
                  {
                    model: DataAccess.Models["profiles"],
                    as: "individualProfile"
                  }
                ]
              },
              {
                model: DataAccess.Models["users"],
                as: "operator"
              },
              {
                model: DataAccess.Models["profileTypes"]
              },
              {
                model: DataAccess.Models["businessTypes"]
              },
              {
                model: DataAccess.Models["profileGrades"]
              }
            ]
          },
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          }
        ],
        order: ["creditStatusId", "createdAt"]
      })
        .then(result => this.addMoneyUnitToResult(result))
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result))
          let resultCount = 0;
          let resolveResult = () => {
            if (++resultCount == result.rows.length)
              resolve(result)
          }
          if (result.rows.length == 0) resolve(result)
          result.rows.forEach(el => {
            (new CreditExpensesManager).calculateCreditExpensesSummary(el.id)
              .then(creditExpensesSummary => {
                el.usedAmount = creditExpensesSummary.expenses;
                // el.remainAmount = creditSummary.remain;
                // el.blockedAmount = creditSummary.blocked;
                resolveResult();
              })
              .catch(err => RejectHandler(reject, err));
          })
        })
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  calculateNumberOfProfileCredits(profileId: number) {
    console.log("calculateNumberOfProfileCredits")
    return new Promise((resolve, reject) => {
      this.findAndCountAll({ where: { profileId } })
        .then((result: any) => resolve(result.count))
        .catch(err => RejectHandler(reject, err))
    })
  }

  clearCredit(item: any, operatorId: number) {
    return new Promise((resolve, reject) => {
      let credit: credit;
      let finalResult;
      this.find({
        where: { id: item.id },
        include: [
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          }
        ]
      })
        .then((credit_result: any) => {
          if (!credit_result[0]) {
            RejectHandler(reject, null, "There is no record with this id");
            throw "There is no record with this id";
          }
          else if (credit_result[0].creditStatus.code != "3") {
            RejectHandler(reject, null, "This credit status cannot be changed to clear");
            throw "This credit status cannot be changed to clear";
          }
          else {
            credit = credit_result[0].dataValues;
            return (new CreditStatusesManager).findByCode("4");
          }
        })
        .then(status_result => {
          credit.creditStatusId = status_result.id;
          return this.update(credit)
        })
        .then(update_result => {
          finalResult = update_result;
          if (item.addCredit)
            return this.create({
              amount: credit.amount,
              creditStatusId: undefined,
              currencyId: credit.currencyId,
              expireDate: undefined,
              id: 0,
              operatorId: undefined,
              period: credit.period,
              profileId: credit.profileId
            },
              operatorId)
          else
            resolve(finalResult)
        })
        .then(create_result => resolve(finalResult))
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  expireCredit(creditId: number) {
    return new Promise((resolve, reject) => {
      let credit: credit;
      this.find({
        where: { id: creditId },
        include: [
          {
            model: DataAccess.Models["creditStatuses"],
            as: "creditStatus"
          }
        ]
      })
        .then((credit_result: any) => {
          if (!credit_result[0]) {
            RejectHandler(reject, null, "There is no record with this id");
            throw "There is no record with this id";
          }
          else if (credit_result[0].creditStatus.code != "1") {
            RejectHandler(reject, null, "This credit status cannot be changed to expired");
            throw "This credit status cannot be changed to expired";
          }
          else {
            credit = credit_result[0].dataValues;
            return (new CreditStatusesManager).findByCode("3");
          }
        })
        .then(status_result => {
          credit.creditStatusId = status_result.id;
          credit.expireDate = new Date();
          return this.update(credit)
        })
        .then(update_result => { resolve(update_result) })
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  blockCreditForBooking(item: any) {
    return new Promise((resolve, reject) => {
      let profileCreditIds = [];
      let creditAmount = 0;
      let creditId = 0;
      let newExpense = new creditExpense();
      newExpense.id = 0;
      newExpense.amount = item.amount;
      newExpense.bookingId = item.bookingId;
      newExpense.currencyId = item.currencyId;
      newExpense.userId = item.userId;
      let blockedAmount = item.amount;
      (new CreditStatusesManager()).findByCode("5")
        .then(status_result => {
          newExpense.creditStatusId = status_result.id;
          return DataAccess.ModelInstance.transaction((t) => {
            return DataAccess.ModelInstance.query(
              `UPDATE "public"."creditExpenses" SET "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='7') 
            WHERE "creditExpenses"."bookingId"='${item.bookingId}' AND "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='5')`,
              {
                transaction: t,
                type: Sequelize.QueryTypes.UPDATE
              }
            )
              .then(update_result => {
                return DataAccess.ModelInstance.query(
                  `SELECT "id" FROM credits WHERE credits."profileId" = ${item.profileId}`,
                  {
                    transaction: t,
                    type: Sequelize.QueryTypes.SELECT
                  }
                )
              })
              .then(credit_result => {
                profileCreditIds = credit_result.map(el => el.id);
                return DataAccess.ModelInstance.query(
                  `SELECT "id",amount FROM credits WHERE credits."creditStatusId" = (SELECT "id" FROM "creditStatuses" WHERE code = '1') AND credits."profileId" = ${item.profileId}`,
                  {
                    transaction: t,
                    type: Sequelize.QueryTypes.SELECT
                  }
                )
              })
              .then(credit_result => {
                if (credit_result.length == 0)
                  throw new Error("No active credit for this profile");
                else {
                  newExpense.creditId = credit_result[0].id;
                  creditAmount = credit_result[0].amount;
                  creditId = credit_result[0].id;
                  return DataAccess.ModelInstance.query(
                    `SELECT "employeeAllocations".amount,"employeeAllocations"."createdAt","employeeAllocations"."expireDate","employeeAllocationStatuses".code FROM "employeeAllocations"
                     INNER JOIN users ON users."individualProfileId"="employeeAllocations"."profileId"
                     INNER JOIN "employeeAllocationStatuses" ON "employeeAllocationStatuses"."id"="employeeAllocations"."employeeAllocationStatusId" 
                     WHERE "employeeAllocations"."ownerProfileId"=${item.profileId} AND users."id"=${item.userId}`,
                    {
                      transaction: t,
                      type: Sequelize.QueryTypes.SELECT
                    }
                  )
                }
              })
              .then(allocation_result => {
                // let a = [];
                // a.some(el => el.code == '1')
                if (allocation_result.length == 0)
                  return DataAccess.ModelInstance.query(
                    `SELECT ${creditAmount} - COALESCE("sum"("creditExpenses".amount),0) AS netamount FROM "creditExpenses"
                   INNER JOIN "creditStatuses" ON "creditStatuses"."id" = "creditExpenses"."creditStatusId"
                   WHERE "creditExpenses"."creditId"=${creditId} AND "creditStatuses".code IN ('2','5')`,
                    {
                      transaction: t,
                      type: Sequelize.QueryTypes.SELECT
                    }
                  )
                else if (allocation_result.some(el => el.code == '1')) {
                  let allocation = allocation_result.find(el => el.code == '1');
                  return DataAccess.ModelInstance.query(
                    `SELECT ${(allocation.amount)} - COALESCE("sum"("creditExpenses".amount),0) AS netamount FROM "creditExpenses"
                   INNER JOIN "creditStatuses" ON "creditStatuses"."id" = "creditExpenses"."creditStatusId"
                   WHERE "creditExpenses"."creditId" IN (${profileCreditIds.join(",")}) AND "creditStatuses".code IN ('2','5')
                   AND "creditExpenses"."createdAt">='${typeof (allocation.createdAt) == "string" ? allocation.createdAt : allocation.createdAt.toISOString()}' 
                   AND "creditExpenses"."createdAt"<='${typeof (allocation.expireDate) == "string" ? allocation.expireDate : allocation.expireDate.toISOString()}' 
                   AND "creditExpenses"."userId"=${item.userId}`,
                    {
                      transaction: t,
                      type: Sequelize.QueryTypes.SELECT
                    }
                  )
                }
                else
                  throw new Error("No active employee allocaction");
              })
              .then(credit_result => {
                if (credit_result[0].netamount <= 0)
                  throw new Error("Credit net amount is zero");
                else if (item.amount > credit_result[0].netamount) {
                  newExpense.amount = credit_result[0].netamount;
                  blockedAmount = credit_result[0].netamount;
                  return DataAccess.Models.creditExpenses.create(newExpense, { transaction: t });
                }
                else
                  return DataAccess.Models.creditExpenses.create(newExpense, { transaction: t });
              });
          })
        })
        .then(result => {
          this.recalculateCredit(item.profileId);
          resolve(blockedAmount)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  payCreditForBooking(item: any) {
    return new Promise((resolve, reject) => {
      let paidAmount = 0;
      let creditId = 0;
      DataAccess.ModelInstance.transaction((t) => {
        return DataAccess.ModelInstance.query(
          `SELECT "id",amount FROM credits WHERE credits."creditStatusId" = (SELECT "id" FROM "creditStatuses" WHERE code = '1') AND credits."profileId" = ${item.profileId}`,
          {
            transaction: t,
            type: Sequelize.QueryTypes.SELECT
          }
        )
          .then(credit_result => {
            if (credit_result.length == 0)
              resolve({ id: creditId, amount: paidAmount })
            else {
              creditId = credit_result[0].id;
              return DataAccess.ModelInstance.query(
                `UPDATE "public"."creditExpenses" SET "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='2') 
                  WHERE "creditExpenses"."bookingId"='${item.bookingId}' AND "creditExpenses"."creditId"=${credit_result[0].id}
                  AND "creditExpenses"."currencyId"='${item.currencyId}' AND "creditExpenses"."userId"=${item.userId} AND "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='5')`,
                //  AND "creditExpenses"."amount"=${item.amount}
                {
                  transaction: t,
                  type: Sequelize.QueryTypes.UPDATE
                }
              )
            }
          })
          .then(update_result => {
            return DataAccess.ModelInstance.query(
              `SELECT "creditExpenses"."id", "creditExpenses".amount AS paidamount FROM "creditExpenses" INNER JOIN "creditStatuses" ON "creditStatuses"."id" = "creditExpenses"."creditStatusId"
                  WHERE "creditExpenses"."bookingId"='${item.bookingId}' AND "creditExpenses"."creditId"=${creditId}
                  AND "creditExpenses"."currencyId"='${item.currencyId}' AND "creditExpenses"."userId"=${item.userId} AND "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='2')`,
              //  AND "creditExpenses"."amount"=${item.amount}
              {
                transaction: t,
                type: Sequelize.QueryTypes.SELECT
              }
            )
          })
          .then(credit_result => {
            if (credit_result.length == 0) {
              // throw new Error("Credit payment error");
              creditId = undefined;
              paidAmount = 0;
              return Promise.resolve()
            }
            else {
              paidAmount = credit_result[0].paidamount;
              creditId = credit_result[0].id;
              return Promise.resolve()
            }
          });
      })
        .then(result => {
          this.recalculateCredit(item.profileId);
          resolve({ id: creditId, amount: paidAmount })
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  unBlockCreditForBooking(bookingId: string, profileId: number) {
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.transaction((t) => {
        return DataAccess.ModelInstance.query(
          `UPDATE "public"."creditExpenses" SET "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='7') 
                  WHERE "creditExpenses"."bookingId"='${bookingId}'  AND "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='5')`,
          //  AND "creditExpenses"."amount"=${item.amount}
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
          this.recalculateCredit(profileId);
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err, err.message));
    })
  }

  getAllCreditIdsByProfileId(profileId: number) {
    return new Promise<number[]>((resolve, reject) => {
      this.find({
        where: { profileId },
      })
        .then((result) => {
          result = JSON.parse(JSON.stringify(result));
          let finalResult = result.map(el => el.id)
          resolve(finalResult)
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  private updateExpiredCredits() {
    console.log("update");
  }

  private calculateServiceStartTime(): number {
    let startTime = new Date().setHours(0, 0, 0, 0);
    let currenctTime = new Date();
    let returnValue = startTime - currenctTime.getTime();
    if (returnValue < 0)
      returnValue += 24 * 3600 * 1000;
    return returnValue;
  }

  private calculateCreditAmount(profileId: number, credit: credit) {
    let currencyId = "5c6a7107e8a2a14358df03d3";
    let result = new creditAmount();
    if (credit && credit.currencyId)
      currencyId = credit.currencyId;
    return new Promise<creditAmount>((resolve, reject) => {
      ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + currencyId)
        .then((moneyUnit_result: any) => {
          result.moneyUnit = moneyUnit_result.payload.data;
          if (!credit || credit.amount == 0)
            resolve(result);
          return (new CreditExpensesManager).calculateCreditExpensesSummary(credit.id)
        })
        .then(expensesSummary_result => {
          result.total = credit.amount;
          result.remain = credit.amount - expensesSummary_result.expenses - expensesSummary_result.blocked;
          result.blocked = expensesSummary_result.blocked;
          resolve(result);
        })
        .catch(err => RejectHandler(reject, err))
    })
  }

  private addBookingToResult(result: any = { rows: [] }) {
    result = JSON.parse(JSON.stringify(result));
    return new Promise((resolve, reject) => {
      let resultCount = 0;
      let totalCount = result.rows.reduce((p, el) => p + el.creditExpenses.length, 0);
      let resolveResult = () => {
        if (++resultCount == totalCount)
          resolve(result)
      }
      if (totalCount == 0) resolve(result)
      else
        result.rows.forEach(element => {
          element.creditExpenses.forEach(exp => {
            if (exp.bookingId && exp)
              ExternalRequest.syncGetRequest(process.env.MAIN_URL + "booking/id/" + exp.bookingId)
                .then((booking_result: any) => {
                  exp.booking = booking_result.payload.data;
                  resolveResult();
                })
                .catch(err => RejectHandler(reject, err));
            else
              resolveResult();
          })
        });
    })
  }

  private addMoneyUnitToResult(result: any = { rows: [] }) {
    result = JSON.parse(JSON.stringify(result));
    return new Promise((resolve, reject) => {
      let moneyUnitList = [];
      if (result.rows.length == 0) resolve(result)
      result.rows.forEach(el => {
        moneyUnitList.push(el.currencyId)
        if (el.creditExpenses)
          el.creditExpenses.forEach(exp => {
            moneyUnitList.push(exp.currencyId)
          });
      })
      moneyUnitList = Array.from(new Set(moneyUnitList))
      ExternalRequest.syncPostRequest(process.env.MAIN_URL + "money_unit/list", moneyUnitList, "POST")
        .then((moneyUnit_result: any) => {
          result.rows.forEach(el => {
            el.currency = moneyUnit_result.payload.data.find(mu => el.currencyId == mu._id)
            if (el.creditExpenses)
              el.creditExpenses.forEach(exp => {
                exp.currency = moneyUnit_result.payload.data.find(mu => exp.currencyId == mu._id)
              });
          })
          resolve(result);
        })
        .catch(err => RejectHandler(reject, err));
    })
  }
}
Object.seal(CreditsManager);
