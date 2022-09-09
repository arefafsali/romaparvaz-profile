var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { walletStatus } from "../../Common/Metadata/walletStatusMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler, ResponseHandler } from "../../Repositories/Utility/ActionResult"
export class WalletStatusesManager extends BaseRepository<walletStatus> {
  constructor() {
    super("walletStatuses");
  }

  findByCode(code: string) {
    return new Promise<walletStatus>((resolve, reject) => {
      this.find({ where: { code } })
        .then(result => resolve(result[0]))
        .catch(err => reject(err))
    })
  }
}
Object.seal(WalletStatusesManager);
