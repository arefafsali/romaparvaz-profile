
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler, ResponseHandler } from "../../Repositories/Utility/ActionResult"
import { creditExpense } from "../../Common/Metadata/creditExpenseMetadata";
import { CreditsManager } from "./CreditsManager";
export class CreditExpensesManager extends BaseRepository<creditExpense> {
  constructor() {
    super("creditExpenses");

    //Credit expenses service to delete pending expenses
    setInterval(this.cancelBlockedCredits, 60 * 1000)
  }

  calculateCreditExpensesSummary(creditId: number) {
    let result = { expenses: 0, blocked: 0 }
    return new Promise<{ expenses: number, blocked: number }>((resolve, reject) => {
      DataAccess.ModelInstance.query(
        `SELECT sum("creditExpenses".amount) AS expenses FROM "creditExpenses" INNER JOIN "creditStatuses" ON "creditStatuses"."id"="creditExpenses"."creditStatusId" 
        WHERE "creditExpenses"."creditId"=${creditId} AND "creditStatuses"."code"='2'`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      )
        .then(expenses_result => {
          if (expenses_result[0].expenses) result.expenses = expenses_result[0].expenses;
          return DataAccess.ModelInstance.query(
            `SELECT sum("creditExpenses".amount) AS blocked FROM "creditExpenses" INNER JOIN "creditStatuses" ON "creditStatuses"."id"="creditExpenses"."creditStatusId" 
            WHERE "creditExpenses"."creditId"=${creditId} AND "creditStatuses"."code"='5'`,
            {
              type: Sequelize.QueryTypes.SELECT
            }
          )
        })
        .then(blocked_result => {
          if (blocked_result[0].blocked) result.blocked = blocked_result[0].blocked;
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err))
    })
  }

  calculateMultipleCreditExpensesSummary(creditIds: number[], startDate: string | Date, endDate: string | Date, userId: number) {
    creditIds = [...creditIds, 0]
    let result = { expenses: 0, blocked: 0 }
    if (typeof startDate != "string") startDate = startDate.toISOString();
    if (typeof endDate != "string") endDate = endDate.toISOString();
    return new Promise<{ expenses: number, blocked: number }>((resolve, reject) => {
      DataAccess.ModelInstance.query(
        `SELECT sum("creditExpenses".amount) AS expenses FROM "creditExpenses" INNER JOIN "creditStatuses" ON "creditStatuses"."id"="creditExpenses"."creditStatusId" 
        WHERE "creditExpenses"."creditId" IN (${creditIds.join(",")}) AND "creditStatuses"."code"='2' 
        AND "creditExpenses"."createdAt">='${startDate}' AND "creditExpenses"."createdAt"<='${endDate}' AND "creditExpenses"."userId"=${userId}`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      )
        .then(expenses_result => {
          if (expenses_result[0].expenses) result.expenses = expenses_result[0].expenses;
          return DataAccess.ModelInstance.query(
            `SELECT sum("creditExpenses".amount) AS blocked FROM "creditExpenses" INNER JOIN "creditStatuses" ON "creditStatuses"."id"="creditExpenses"."creditStatusId" 
            WHERE "creditExpenses"."creditId" IN (${creditIds.join(",")}) AND "creditStatuses"."code"='5' 
            AND "creditExpenses"."createdAt">='${startDate}' AND "creditExpenses"."createdAt"<='${endDate}' AND "creditExpenses"."userId"=${userId}`,
            {
              type: Sequelize.QueryTypes.SELECT
            }
          )
        })
        .then(blocked_result => {
          if (blocked_result[0].blocked) result.blocked = blocked_result[0].blocked;
          resolve(result)
        })
        .catch(err => RejectHandler(reject, err))
    })
  }

  private cancelBlockedCredits() {
    let profileIdList = [];
    let tempDate = new Date();
    tempDate.setMinutes(tempDate.getMinutes() - parseInt(process.env.CREDIT_WALLET_BLOCK_TIMEOUT));
    DataAccess.ModelInstance.transaction((t) => {
      return DataAccess.ModelInstance.query(
        `SELECT DISTINCT credits."profileId" FROM "creditExpenses" INNER JOIN credits on credits."id" = "creditExpenses"."creditId"
        INNER JOIN "creditStatuses" ON "creditStatuses"."id" = "creditExpenses"."creditStatusId"
        WHERE "creditExpenses"."createdAt"<'${tempDate.toISOString()}' AND "creditStatuses".code ='5'`,
        {
          transaction: t,
          type: Sequelize.QueryTypes.SELECT
        }
      )
        .then(result => {
          profileIdList = result.map(el => el.profileId)
          return DataAccess.ModelInstance.query(
            `UPDATE "public"."creditExpenses" SET "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='7') 
            WHERE "creditExpenses"."createdAt"<'${tempDate.toISOString()}' AND "creditStatusId" = (SELECT id FROM "creditStatuses" WHERE code='5')`,
            {
              transaction: t,
              type: Sequelize.QueryTypes.UPDATE
            }
          )
        })
    })
      .then(result => {
        let creditMGM = new CreditsManager();
        profileIdList.forEach(id => creditMGM.recalculateCredit(id))
      })
      .catch(err => { console.log("credit expenses service", err) })
  }
}
Object.seal(CreditExpensesManager);
