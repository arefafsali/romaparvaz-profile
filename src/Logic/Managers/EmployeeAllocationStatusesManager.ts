var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler, ResponseHandler } from "../../Repositories/Utility/ActionResult"
import { employeeAllocationStatus } from "../../Common/Metadata/employeeAllocationStatusMetadata";
export class EmployeeAllocationStatusesManager extends BaseRepository<employeeAllocationStatus> {
  constructor() {
    super("employeeAllocationStatuses");
  }

  findByCode(code: string) {
    return new Promise<employeeAllocationStatus>((resolve, reject) => {
      this.find({ where: { code } })
        .then(result => resolve(result[0]))
        .catch(err => reject(err))
    })
  }
}
Object.seal(EmployeeAllocationStatusesManager);
