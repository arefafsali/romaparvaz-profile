import { Request, Response, NextFunction } from "express";
import { IncomesManager } from "../Logic/Managers/IncomesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { deleteRules } from "../Repositories/Validations/BusinessTypeValidate"
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
export class IncomesController extends BaseRouter {
  constructor() {
    super(IncomesManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: ["incomesget"],
      getById: ["incomesget"],
      insert: ["backendapi"],
      update: ["backendapi"],
      delete: ["backendapi"]
    }
    // validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy);
    this.router.post(
      "/set_commission_by_income",
      Permission.permissionRequired(["backendapi"]),
      this.setCommissionByIncome
    );
    this.router.post(
      "/msps",
      Permission.permissionRequired(["backendapi"]),
      this.insertMSPSRecords
    );
  }
  setCommissionByIncome = (req: Request, res: Response, next: NextFunction) => {
    this.manager.setCommissionByIncome(req.body.id).then(result => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err)
      });
  };
  insertMSPSRecords = (req: Request, res: Response, next: NextFunction) => {
    this.manager.insertMSPSRecords(req.body).then(result => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err)
      });
  };
}
const incomesController = new IncomesController();

export default incomesController.router;
