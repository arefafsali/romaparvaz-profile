
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { creditStatus } from "../../Common/Metadata/creditStatusMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler, ResponseHandler } from "../../Repositories/Utility/ActionResult"
export class CreditStatusesManager extends BaseRepository<creditStatus> {
  constructor() {
    super("creditStatuses");
  }

  findByCode(code: string) {
    return new Promise<creditStatus>((resolve, reject) => {
      this.find({ where: { code } })
        .then(result => resolve(result[0]))
        .catch(err => reject(err))
    })
  }
}
Object.seal(CreditStatusesManager);
