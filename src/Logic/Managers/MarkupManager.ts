import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler } from "../../Repositories/Utility/ActionResult"

var Sequelize = require("sequelize");
var Op = Sequelize.Op;
export class MarkupManager {
  constructor() { }


  getMarkup(gatewayId: string, airlineCodes: string[], sellerProfileId: number, buyerProfileId: number) {
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.query(
        `SELECT * FROM "fn_Get_Markup"(
          ${sellerProfileId},${buyerProfileId},'${gatewayId}',
          '{${airlineCodes.join()}}','${''/*currencyId*/}')`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      ).then(markupResult => {
        resolve(markupResult);
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }
}
Object.seal(MarkupManager);
