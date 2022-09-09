import { Request, Response, NextFunction } from "express";
import { ServiceTypesManager } from "../Logic/Managers/ServiceTypesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";

export class ServiceTypesController extends BaseRouter {
  constructor() {
    super(ServiceTypesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: true,
      getById: ["servicetypesget"],
      insert: ["servicetypesedit"],
      update: ["servicetypesedit"],
      delete: ["servicetypesedit"]
    }
    super.init(permissionPoilicy);
    this.router.get("/code/:code", Permission.permissionRequired(false), this.getByCode);
  }

  getByCode = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByCode(req.params.code).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const serviceTypesController = new ServiceTypesController();

export default serviceTypesController.router;
