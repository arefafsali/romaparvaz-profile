import { Request, Response, NextFunction } from "express";
import { RolesManager } from "../Logic/Managers/RolesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import {
  deleteRules
} from "../Repositories/Validations/RoleValidate";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
export class RolesController extends BaseRouter {
  constructor() {
    super(RolesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: true,
      getById: ["rolesget"],
      insert: ["rolesedit"],
      update: ["rolesedit"],
      delete: ["rolesedit"]
    }
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.post("/all/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["rolesget"]),
      this.getByPaging);
  }

  getByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByPaging(req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const rolesController = new RolesController();

export default rolesController.router;
