
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { employeeAllocation, employeeAllocationAmount } from "../../Common/Metadata/employeeAllocationMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler, ResponseHandler } from "../../Repositories/Utility/ActionResult"
import { EmployeeAllocationStatusesManager } from "./EmployeeAllocationStatusesManager";
import { ProfilesManager } from "./ProfilesManager";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import { CreditExpensesManager } from "./CreditExpensesManager";
import { creditAmount, profile } from "../../Common/Metadata/profileMetadata";
import { creditExpense } from "../../Common/Metadata/creditExpenseMetadata";
import { CreditsManager } from "./CreditsManager";
import { UsersManager } from "./UsersManager";
export class EmployeeAllocationsManager extends BaseRepository<employeeAllocation> {
  constructor() {
    super("employeeAllocations");
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
        order: [[Sequelize.col("employeeAllocations.createdAt"), "DESC"]]
      })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err));
    });
  }

  getByProfileId(profileId: number, ownerProfileId: number, page_number: number, items_per_page: number, filter?: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let finalResult;
      let _where: any = {};
      if (profileId == 0)
        _where = { ownerProfileId }
      else
        _where = { profileId, ownerProfileId }

      this.findAndCountAll({
        where: _where,
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "profile"
          },
          {
            model: DataAccess.Models["profiles"],
            as: "ownerProfile"
          },
          {
            model: DataAccess.Models["employeeAllocationStatuses"],
            as: "employeeAllocationStatus"
          }
        ],
        order: [[Sequelize.col("employeeAllocations.createdAt"), "DESC"]]
      })
        .then((result: any) => {
          finalResult = JSON.parse(JSON.stringify(result));
          return this.addMoneyUnitToResult(finalResult)
        })
        .then((result: any) => {
          let resultCount = 0;
          let resolveResult = () => {
            if (++resultCount == result.rows.length)
              resolve(result)
          }
          if (result.rows.length == 0) resolve(result)
          result.rows.forEach(el => {
            this.getEmployeeAllocationExpenses(el)
              .then(expenses_result => {
                el.blockedAmount = expenses_result.reduce((p, c: any) => c.creditStatus.code == 5 ? p + c.amount : p, 0);
                el.remainAmount = el.amount - expenses_result.reduce((p, c: any) => c.creditStatus.code == 2 ? p + c.amount : p, 0) - el.blockedAmount;
                el.hasExpenses = expenses_result.length > 0 ? true : false;
                resolveResult();
              })
              .catch(err => RejectHandler(reject, err));
          })
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  create(item: employeeAllocation) {
    this.referrerOption = {
      user: item.userId,
      apiName: "create",
      apiType: "POST"
    }
    let moneyUnit: any;
    item.amount = parseFloat(item.amount.toString());
    return new Promise((resolve, reject) => {
      ExternalRequest.syncGetRequest(process.env.MAIN_URL + "money_unit/id/" + item.currencyId)
        .then((moneyUnit_result: any) => {
          moneyUnit = moneyUnit_result.payload.data;
          if (moneyUnit)
            return this.find({
              where: {
                [Op.and]: [
                  Sequelize.where(Sequelize.col('employeeAllocations.ownerProfileId'), item.ownerProfileId),
                  Sequelize.where(Sequelize.col('employeeAllocations.profileId'), item.profileId),
                  Sequelize.where(Sequelize.col('employeeAllocationStatus.code'), '1')
                ]
              },
              include: [
                {
                  model: DataAccess.Models["employeeAllocationStatuses"],
                  as: "employeeAllocationStatus"
                }
              ]
            })
          else
            RejectHandler(reject, null, "The currencyId does not exist")
        })
        .then(find_result => {
          if (find_result.length > 0)
            RejectHandler(reject, null, "There is already an active allocation for this profile")
          else
            return (new ProfilesManager).findOne(item.ownerProfileId)
        })
        .then((profile_result: any[]) => {
          if (profile_result[0] && profile_result[0].businessTypeId != null && profile_result[0].isApproved)
            return (new EmployeeAllocationStatusesManager).findByCode("1")
          else
            RejectHandler(reject, null, "This profile is not eligible for a allocation")
        })
        .then(status_result => {
          item.employeeAllocationStatusId = status_result.id;
          let tempDate = new Date();
          tempDate.setHours(0, -1 * tempDate.getTimezoneOffset(), 0, 0);
          tempDate.setDate(tempDate.getDate() + item.period)
          tempDate = new Date(tempDate.toISOString().substr(0, 10));
          item.expireDate = tempDate;
          return super.create(item)
        })
        .then(result => {
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  createAndDeactivateZeroAllocation(item: employeeAllocation) {
    this.referrerOption = {
      user: item.userId,
      apiName: "createAndDeactivateZeroAllocation",
      apiType: "POST"
    }
    let currentAllocation: employeeAllocation;
    item.amount = parseFloat(item.amount.toString());
    return new Promise((resolve, reject) => {
      this.findProfileActiveAllocation(item.ownerProfileId, item.profileId)
        .then(employeeAllocations => {
          currentAllocation = employeeAllocations[0]
          if (employeeAllocations.length == 0)
            RejectHandler(reject, null, "There is no active allocation for this profile")
          else
            return this.recalculateAllocation(item.ownerProfileId, item.profileId)
        })
        .then(recalculate_result => {
          if (recalculate_result.remain != 0)
            RejectHandler(reject, null, "The current active allocation has remain amount")
          else if (recalculate_result.blocked != 0)
            RejectHandler(reject, null, "The current active allocation has blocked amount, wait until the blocked amount become clear")
          else
            return this.expireEmployeeAllocation(currentAllocation.id)
        })
        .then(expireResult => {
          return this.create(item)
        })
        .then(create_result => {
          resolve(create_result)
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  update(item: employeeAllocation, ownerProfileId?: number) {
    let employeeAllocation: employeeAllocation;
    item.amount = parseFloat(item.amount.toString());
    return new Promise((resolve, reject) => {
      this.findOne(item.id)
        .then((employeeAllocation_result: any) => {
          if (!employeeAllocation_result[0])
            RejectHandler(reject, null, "There is no record with this id")
          employeeAllocation = employeeAllocation_result[0].dataValues;
          if (employeeAllocation.ownerProfileId != ownerProfileId)
            RejectHandler(reject, null, "You are not the record owner")
          return this.find({
            where: {
              [Op.and]: [
                Sequelize.where(Sequelize.col('employeeAllocations.ownerProfileId'), employeeAllocation.ownerProfileId),
                Sequelize.where(Sequelize.col('employeeAllocations.profileId'), employeeAllocation.profileId),
                Sequelize.where(Sequelize.col('employeeAllocationStatus.code'), '1')
              ]
            },
            include: [
              {
                model: DataAccess.Models["employeeAllocationStatuses"],
                as: "employeeAllocationStatus"
              }
            ]
          })
        })
        .then(find_result => {
          // TODO check if status id is 2 then update expire date
          if (find_result.length > 0 && item.employeeAllocationStatusId == 1 && item.employeeAllocationStatusId != employeeAllocation.employeeAllocationStatusId)
            RejectHandler(reject, null, "There is already an active allocation for this profile")
          else {
            if (item.employeeAllocationStatusId) employeeAllocation.employeeAllocationStatusId = item.employeeAllocationStatusId;
            if (item.expireDate) employeeAllocation.expireDate = item.expireDate
            if (item.period) employeeAllocation.period = item.period
            if (item.employeeAllocationStatusId == 2) employeeAllocation.expireDate = new Date();
            return this.calculateAllocationExpenseSummary(employeeAllocation)
          }
        }).then(expensesSummary_result => {
          if (item.amount && item.amount < (expensesSummary_result.blocked + expensesSummary_result.expenses))
            RejectHandler(reject, null, "The amount cannot be less than the sum of expenses")
          else {
            if (item.amount) employeeAllocation.amount = item.amount;
            return super.update(employeeAllocation)
          }
        })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err));
    })
  }

  recalculateAllocation(ownerProfileId: number, profileId: number) {
    return new Promise<employeeAllocationAmount>((resolve, reject) => {
      this.findProfileActiveAllocation(ownerProfileId, profileId)
        .then(find_result => {
          return this.calculateAllocationAmount(find_result[0])
        })
        .then(calc_result => resolve(calc_result))
        .catch(err => RejectHandler(reject, err));
    })
  }

  // getProfileAllCreditsSummary(profileId: number) {
  //   this.referrerOption = {
  //     user: null,
  //     apiName: "getProfileAllCreditsSummary",
  //     apiType: "GET"
  //   }
  //   return new Promise((resolve, reject) => {
  //     this.find({
  //       where: { profileId },
  //       include: [
  //         {
  //           model: DataAccess.Models["creditStatuses"],
  //           as: "creditStatus"
  //         },
  //         {
  //           model: DataAccess.Models["creditExpenses"],
  //           as: "creditExpenses",
  //           include: [{
  //             model: DataAccess.Models["creditStatuses"],
  //             as: "creditStatus"
  //           }]
  //         }
  //       ]
  //     })
  //       .then((result: any[]) => {
  //         return this.addMoneyUnitToResult({ rows: result })
  //       })
  //       .then((result: any) => {
  //         let finalResult = {
  //           total: 0,
  //           used: 0,
  //           remain: 0,
  //           currency: result.rows[0] ? result.rows[0].currency : null
  //         }
  //         finalResult.total = result.rows.reduce((p, c) => p + c.amount, 0);
  //         finalResult.used = result.rows.reduce((p, c) => p + c.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 ? p + c.amount : p, 0), 0);
  //         finalResult.remain = result.rows.filter(el => el.creditStatus.code == 1).map(el => el.amount - el.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 || c.creditStatus.code == 5 ? p + c.amount : p, 0))[0];
  //         if (!finalResult.remain)
  //           finalResult.remain = 0;
  //         resolve(finalResult);
  //       })
  //       .catch(err => RejectHandler(reject, err));
  //   });
  // }

  getAllocationExpensesByAllocationId(ownerProfileId: number, allocationId: number, page_number: number, items_per_page: number) {
    return new Promise((resolve, reject) => {
      let finalResult: any = {};
      this.find({ where: { id: allocationId } })
        .then((employeeAllocation_result: any) => {
          employeeAllocation_result = JSON.parse(JSON.stringify(employeeAllocation_result));
          if (employeeAllocation_result.length == 0 || (employeeAllocation_result.length > 0 && employeeAllocation_result[0].ownerProfileId != ownerProfileId))
            RejectHandler(reject, null, "You do not have access to this record");
          else {
            return this.getEmployeeAllocationExpenses(employeeAllocation_result[0])
          }
        })
        .then(expenses_result => {
          finalResult.count = expenses_result.length;
          finalResult.rows = expenses_result.slice(page_number * items_per_page, (page_number + 1) * items_per_page)
          return this.addMoneyUnitToResult(finalResult)
        })
        .then(result => this.addBookingToResult(result))
        .then((result: any) => resolve(result))
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  findProfileActiveAllocation(ownerProfileId: number, profileId: number) {
    return this.find({
      where: {
        [Op.and]: [
          Sequelize.where(Sequelize.col('employeeAllocations.ownerProfileId'), ownerProfileId),
          Sequelize.where(Sequelize.col('employeeAllocations.profileId'), profileId),
          Sequelize.where(Sequelize.col('employeeAllocationStatus.code'), '1')
        ]
      },
      include: [
        {
          model: DataAccess.Models["employeeAllocationStatuses"],
          as: "employeeAllocationStatus"
        }
      ]
    })
  }

  // getActiveCredits(body: any, page_number: number, items_per_page: number) {
  //   return new Promise((resolve, reject) => {
  //     let query = {
  //       [Op.and]: [
  //         Sequelize.where(Sequelize.col('creditStatus.code'), '1')
  //       ]
  //     };
  //     if (body.phrase)
  //       query = {
  //         ...query,
  //         [Op.or]: [
  //           Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.basicInfo'), 'managerName')), {
  //             [Op.like]: "%" + body.phrase.toLowerCase() + "%"
  //           }),
  //           Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'fa')), {
  //             [Op.like]: "%" + body.phrase.toLowerCase() + "%"
  //           }),
  //           Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'en')), {
  //             [Op.like]: "%" + body.phrase.toLowerCase() + "%"
  //           })
  //         ]
  //       };
  //     this.findAndCountAll({
  //       where: query,
  //       offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
  //       limit: parseInt(items_per_page.toString()),
  //       include: [
  //         {
  //           model: DataAccess.Models["profiles"],
  //           as: "profile",
  //           include: [
  //             {
  //               model: DataAccess.Models["users"],
  //               as: "creator",
  //               include: [
  //                 {
  //                   model: DataAccess.Models["profiles"],
  //                   as: "individualProfile"
  //                 }
  //               ]
  //             },
  //             {
  //               model: DataAccess.Models["users"],
  //               as: "operator"
  //             },
  //             {
  //               model: DataAccess.Models["profileTypes"]
  //             },
  //             {
  //               model: DataAccess.Models["businessTypes"]
  //             },
  //             {
  //               model: DataAccess.Models["profileGrades"]
  //             }
  //           ]
  //         },
  //         {
  //           model: DataAccess.Models["creditStatuses"],
  //           as: "creditStatus"
  //         }
  //       ],
  //       order: [[Sequelize.col("credits.createdAt"), "DESC"]]
  //     })
  //       .then(result => this.addMoneyUnitToResult(result))
  //       .then((result: any) => {
  //         result = JSON.parse(JSON.stringify(result))
  //         let resultCount = 0;
  //         let resolveResult = () => {
  //           if (++resultCount == result.rows.length)
  //             resolve(result)
  //         }
  //         if (result.rows.length == 0) resolve(result)
  //         result.rows.forEach(el => {
  //           this.calculateCreditAmount(el.profileId, el)
  //             .then(creditSummary => {
  //               el.remainAmount = creditSummary.remain;
  //               el.blockedAmount = creditSummary.blocked;
  //               resolveResult();
  //             })
  //             .catch(err => RejectHandler(reject, err));
  //         })
  //       })
  //       .catch(err => { console.log(err); RejectHandler(reject, err) });
  //   })
  // }

  // getAllActiveCreditsSummary() {
  //   this.referrerOption = {
  //     user: null,
  //     apiName: "getAllActiveCreditsSummary",
  //     apiType: "GET"
  //   }
  //   return new Promise((resolve, reject) => {
  //     this.find({
  //       where: Sequelize.where(Sequelize.col('creditStatus.code'), '1'),
  //       include: [
  //         {
  //           model: DataAccess.Models["creditStatuses"],
  //           as: "creditStatus"
  //         },
  //         {
  //           model: DataAccess.Models["creditExpenses"],
  //           as: "creditExpenses",
  //           include: [{
  //             model: DataAccess.Models["creditStatuses"],
  //             as: "creditStatus"
  //           }]
  //         }
  //       ]
  //     })
  //       .then((result: any[]) => {
  //         let finalResult = {
  //           total: 0,
  //           used: 0,
  //           remain: 0,
  //           count: 0
  //         }
  //         finalResult.count = result.length
  //         finalResult.total = result.reduce((p, c) => p + c.amount, 0);
  //         finalResult.used = result.reduce((p, c) => p + c.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 ? p + c.amount : p, 0), 0);
  //         finalResult.remain = result.map(el => el.amount - el.creditExpenses.reduce((p, c) => c.creditStatus.code == 2 || c.creditStatus.code == 5 ? p + c.amount : p, 0)).reduce((p, c) => p + c, 0);
  //         if (!finalResult.remain)
  //           finalResult.remain = 0;
  //         resolve(finalResult);
  //       })
  //       .catch(err => RejectHandler(reject, err));
  //   });
  // }

  // getPaidOrExpiredCredits(body: any, page_number: number, items_per_page: number) {
  //   return new Promise((resolve, reject) => {
  //     let query: any = {};
  //     if (body.creditStatusCode)
  //       if (body.creditStatusCode == "3" || body.creditStatusCode == "4")
  //         query = {
  //           ...query,
  //           [Op.or]: [
  //             Sequelize.where(Sequelize.col('creditStatus.code'), body.creditStatusCode)
  //           ]
  //         }
  //       else
  //         RejectHandler(reject, null, "Requested status code is wrong")
  //     else
  //       query = {
  //         ...query,
  //         [Op.or]: [
  //           Sequelize.where(Sequelize.col('creditStatus.code'), '3'),
  //           Sequelize.where(Sequelize.col('creditStatus.code'), '4')
  //         ]
  //       }
  //     if (body.phrase)
  //       query = {
  //         [Op.and]: [
  //           query,
  //           {
  //             [Op.or]: [
  //               Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.basicInfo'), 'managerName')), {
  //                 [Op.like]: "%" + body.phrase.toLowerCase() + "%"
  //               }),
  //               Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'fa')), {
  //                 [Op.like]: "%" + body.phrase.toLowerCase() + "%"
  //               }),
  //               Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('profile.displayName'), 'en')), {
  //                 [Op.like]: "%" + body.phrase.toLowerCase() + "%"
  //               })
  //             ]
  //           }]
  //       };
  //     this.findAndCountAll({
  //       where: query,
  //       offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
  //       limit: parseInt(items_per_page.toString()),
  //       include: [
  //         {
  //           model: DataAccess.Models["profiles"],
  //           as: "profile",
  //           include: [
  //             {
  //               model: DataAccess.Models["users"],
  //               as: "creator",
  //               include: [
  //                 {
  //                   model: DataAccess.Models["profiles"],
  //                   as: "individualProfile"
  //                 }
  //               ]
  //             },
  //             {
  //               model: DataAccess.Models["users"],
  //               as: "operator"
  //             },
  //             {
  //               model: DataAccess.Models["profileTypes"]
  //             },
  //             {
  //               model: DataAccess.Models["businessTypes"]
  //             },
  //             {
  //               model: DataAccess.Models["profileGrades"]
  //             }
  //           ]
  //         },
  //         {
  //           model: DataAccess.Models["creditStatuses"],
  //           as: "creditStatus"
  //         }
  //       ],
  //       order: ["creditStatusId", "createdAt"]
  //     })
  //       .then(result => this.addMoneyUnitToResult(result))
  //       .then((result: any) => {
  //         result = JSON.parse(JSON.stringify(result))
  //         let resultCount = 0;
  //         let resolveResult = () => {
  //           if (++resultCount == result.rows.length)
  //             resolve(result)
  //         }
  //         if (result.rows.length == 0) resolve(result)
  //         result.rows.forEach(el => {
  //           (new CreditExpensesManager).calculateCreditExpensesSummary(el.id)
  //             .then(creditExpensesSummary => {
  //               el.usedAmount = creditExpensesSummary.expenses;
  //               // el.remainAmount = creditSummary.remain;
  //               // el.blockedAmount = creditSummary.blocked;
  //               resolveResult();
  //             })
  //             .catch(err => RejectHandler(reject, err));
  //         })
  //       })
  //       .catch(err => { console.log(err); RejectHandler(reject, err) });
  //   })
  // }

  // calculateNumberOfProfileCredits(profileId: number) {
  //   return new Promise((resolve, reject) => {
  //     this.findAndCountAll({ where: { profileId } })
  //       .then((result: any) => resolve(result.count))
  //       .catch(err => RejectHandler(reject, err))
  //   })
  // }

  // clearCredit(item: any, operatorId: number) {
  //   return new Promise((resolve, reject) => {
  //     let credit: credit;
  //     let finalResult;
  //     this.find({
  //       where: { id: item.id },
  //       include: [
  //         {
  //           model: DataAccess.Models["creditStatuses"],
  //           as: "creditStatus"
  //         }
  //       ]
  //     })
  //       .then((credit_result: any) => {
  //         if (!credit_result[0]) {
  //           RejectHandler(reject, null, "There is no record with this id");
  //           throw "There is no record with this id";
  //         }
  //         else if (credit_result[0].creditStatus.code != "3") {
  //           RejectHandler(reject, null, "This credit status cannot be changed to clear");
  //           throw "This credit status cannot be changed to clear";
  //         }
  //         else {
  //           credit = credit_result[0].dataValues;
  //           return (new CreditStatusesManager).findByCode("4");
  //         }
  //       })
  //       .then(status_result => {
  //         credit.creditStatusId = status_result.id;
  //         return this.update(credit)
  //       })
  //       .then(update_result => {
  //         finalResult = update_result;
  //         if (item.addCredit)
  //           return this.create({
  //             amount: credit.amount,
  //             creditStatusId: undefined,
  //             currencyId: credit.currencyId,
  //             expireDate: undefined,
  //             id: 0,
  //             operatorId: undefined,
  //             period: credit.period,
  //             profileId: credit.profileId
  //           },
  //             operatorId)
  //         else
  //           resolve(finalResult)
  //       })
  //       .then(create_result => resolve(finalResult))
  //       .catch(err => { console.log(err); RejectHandler(reject, err) });
  //   })
  // }

  expireEmployeeAllocation(employeeAllocaionId: number) {
    return new Promise((resolve, reject) => {
      let employeeAllocation: employeeAllocation;
      this.find({
        where: { id: employeeAllocaionId },
        include: [
          {
            model: DataAccess.Models["employeeAllocationStatuses"],
            as: "employeeAllocationStatus"
          }
        ]
      })
        .then((employeeAllocation_result: any) => {
          if (!employeeAllocation_result[0]) {
            RejectHandler(reject, null, "There is no record with this id");
            throw "There is no record with this id";
          }
          else if (employeeAllocation_result[0].employeeAllocationStatus.code != "1") {
            RejectHandler(reject, null, "This credit status cannot be changed to expired");
            throw "This credit status cannot be changed to expired";
          }
          else {
            employeeAllocation = employeeAllocation_result[0].dataValues;
            return (new EmployeeAllocationStatusesManager).findByCode("2");
          }
        })
        .then(status_result => {
          employeeAllocation.employeeAllocationStatusId = status_result.id;
          return this.update(employeeAllocation)
        })
        .then(update_result => { resolve(update_result) })
        .catch(err => { console.log(err); RejectHandler(reject, err) });
    })
  }

  private calculateAllocationAmount(employeeAllocation: employeeAllocation) {
    let currencyId = "5c6a7107e8a2a14358df03d3";
    let result = new employeeAllocationAmount();
    return new Promise<employeeAllocationAmount>((resolve, reject) => {
      if (!employeeAllocation || !employeeAllocation.amount)
        resolve(result);
      else
        currencyId = employeeAllocation.currencyId;
      this.calculateAllocationExpenseSummary(employeeAllocation)
        .then(expensesSummary_result => {
          result.total = employeeAllocation.amount;
          result.remain = employeeAllocation.amount - expensesSummary_result.expenses - expensesSummary_result.blocked;
          result.blocked = expensesSummary_result.blocked;
          resolve(result);
        })
        .catch(err => RejectHandler(reject, err))
    })
  }

  private calculateAllocationExpenseSummary(employeeAllocation: employeeAllocation) {
    return new Promise<{ expenses: number, blocked: number }>((resolve, reject) => {
      let userId;
      (new UsersManager()).find({ where: { individualProfileId: employeeAllocation.profileId } })
        .then(users => {
          userId = users[0].id;
          return (new CreditsManager()).getAllCreditIdsByProfileId(employeeAllocation.ownerProfileId)
        })
        .then(creditIds => (new CreditExpensesManager()).calculateMultipleCreditExpensesSummary(creditIds, employeeAllocation["createdAt"].toISOString(), employeeAllocation.expireDate, userId))
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err))
    })
  }

  private getEmployeeAllocationExpenses(employeeAllocation: employeeAllocation) {
    return new Promise<creditExpense[]>((resolve, reject) => {
      let userId;
      (new UsersManager()).find({ where: { individualProfileId: employeeAllocation.profileId } })
        .then(users => {
          userId = users[0].id;
          return (new CreditsManager()).getAllCreditIdsByProfileId(employeeAllocation.ownerProfileId)
        })
        .then(creditIds => {
          return (new CreditExpensesManager()).find({
            where: [
              { creditId: creditIds },
              { userId },
              // [Op.and]: [
              { createdAt: { [Op.gte]: employeeAllocation["createdAt"] } },
              { createdAt: { [Op.lte]: employeeAllocation.expireDate } }
              // ]
            ],
            include: [{
              model: DataAccess.Models["creditStatuses"],
              as: "creditStatus"
            }]
          })
        })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err))
    })
  }

  private addBookingToResult(result: any = { rows: [] }) {
    result = JSON.parse(JSON.stringify(result));
    return new Promise((resolve, reject) => {
      let resultCount = 0;
      let totalCount = result.rows.length;
      let resolveResult = () => {
        if (++resultCount == totalCount)
          resolve(result)
      }
      if (totalCount == 0) resolve(result)
      else
        result.rows.forEach(element => {
          if (element.bookingId && element)
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
Object.seal(EmployeeAllocationsManager);
