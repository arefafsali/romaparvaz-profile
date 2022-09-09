
import { UserProfilesManager } from './UserProfilesManager';
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { pointOfSale } from "../../Common/Metadata/pointOfSaleMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
export class PointOfSalesManager extends BaseRepository<pointOfSale> {
  constructor() {
    super("pointOfSales");
  }
  getAllIncomeCota(
    item: any,
    page_number: number,
    items_per_page: number) {
    return new Promise((resolve, reject) => {
      this.referrerOption = {
        user: null,
        apiName: "getAllIncomeCota",
        apiType: "POST"
      }
      // TODO: Must convert to function
      let whereClause = '';
      if (item.profileId)
        whereClause = `${whereClause.length ? "" : "AND "} "pointOfSales"."profileId"='${item.profileId}'`;
      if (item.startDate)
        whereClause += `${whereClause.length ? " AND " : "WHERE "} DATE("pointOfSales"."createdAt")>='${item.startDate}'`;
      if (item.endDate)
        whereClause += `${whereClause.length ? " AND " : "WHERE "} DATE("pointOfSales"."createdAt")<='${item.endDate}'`;
      DataAccess.ModelInstance.query(
        `CREATE TEMP TABLE psp(profileId INT, displayName JSONB, isWithdrawAmount DOUBLE PRECISION, notWithdrawAmount DOUBLE PRECISION);
          
          INSERT INTO psp(profileId,displayName)
          SELECT DISTINCT "profileId", "displayName"
          FROM "pointOfSales" LEFT OUTER JOIN profiles
          ON "pointOfSales"."profileId"=profiles.id WHERE profiles."profileTypeId"<>23 ${whereClause};
          
          UPDATE psp SET isWithdrawAmount =
          (SELECT SUM(amount) FROM "pointOfSales"
          WHERE "isWithdraw"=true AND "profileId"=psp.profileId ${whereClause} LIMIT 1);
          
          UPDATE psp SET notWithdrawAmount =
          (SELECT SUM(amount) FROM "pointOfSales"
          WHERE "isWithdraw"=false AND "profileId"=psp.profileId ${whereClause} LIMIT 1);
          
          SELECT profileId AS "profileId", displayName AS "displayName", COALESCE(isWithdrawAmount,0) AS "withdrawAmount", COALESCE(notWithdrawAmount,0) AS "notWithdrawAmount" FROM psp
          OFFSET ${parseInt(page_number.toString()) * parseInt(items_per_page.toString())} LIMIT ${parseInt(items_per_page.toString())};
          
          DROP TABLE psp;`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      ).then((result) => {
        resolve(result);
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  getByProfileId(
    searchItem: any,
    profileId: number,
    page_number: number,
    items_per_page: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let query: any = { profileId: parseInt(profileId.toString()) }
      let seq_arr = []
      if (searchItem.isWithdraw !== undefined && searchItem.isWithdraw !== "")
        query = { ...query, isWithdraw: searchItem.isWithdraw }
      if (searchItem.startDate)
        seq_arr.push(Sequelize.where(
          Sequelize.fn(
            "date",
            Sequelize.col("pointOfSales.createdAt")
          ),
          {
            [Op.gte]: searchItem.startDate
          }
        ))
      if (searchItem.endDate)
        seq_arr.push(Sequelize.where(
          Sequelize.fn(
            "date",
            Sequelize.col("pointOfSales.createdAt")
          ),
          {
            [Op.lte]: searchItem.endDate
          }
        ))
      if (seq_arr.length)
        query = { ...query, [Op.and]: [...seq_arr] }

      this.findAndCountAll({
        where: query,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["withdrawTypes"]
          }
        ]
      }).then((result:any) => {
        result.rows.forEach(row => row.amount = parseFloat(row.amount));
        resolve(result);
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  getByBusinessProfile(profileId: number,
    page_number: number,
    items_per_page: number
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getByBusinessProfile",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let user_profile_Mgm = new UserProfilesManager();
      user_profile_Mgm.getUsersByBusinessProfile(profileId).then((user_profile_result: any) => {
        let profileIds = user_profile_result.map(urp => urp.user.individualProfileId)
        DataAccess.ModelInstance.query(`
                      SELECT profiles."displayName", "pointOfSales"."profileId" ,SUM("pointOfSales".amount) "pointOfSalesTotalAmount", count(*) OVER() as "totalCount",
                      SUM(incomes.amount) "incomesTotalAmount"
                      FROM "pointOfSales" 
                      INNER JOIN profiles ON "pointOfSales"."profileId"=profiles.id
                      INNER JOIN incomes ON "pointOfSales"."incomeId"=incomes.id
                      GROUP BY "pointOfSales"."profileId",profiles."displayName" 
                      HAVING "pointOfSales"."profileId" IN (${profileIds.join()})
                      OFFSET ${parseInt(page_number.toString()) * parseInt(items_per_page.toString())} LIMIT ${parseInt(items_per_page.toString())}
                      `,
          { type: Sequelize.QueryTypes.SELECT }
        ).then(result => resolve(result)).catch(err =>
          RejectHandler(reject, err));
      })
    });
  }
}
Object.seal(PointOfSalesManager);
