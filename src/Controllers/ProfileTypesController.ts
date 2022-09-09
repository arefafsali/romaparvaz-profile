import { Request, Response, NextFunction } from "express";
import { ProfileTypesManager } from "../Logic/Managers/ProfileTypesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { validate } from "../Repositories/Utility/Validator";
import { deleteRules } from "../Repositories/Validations/ProfileTypesValidate";
export class ProfileTypesController extends BaseRouter {
  constructor() {
    super(ProfileTypesManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy(); permissionPoilicy = {
      get: true,
      getById: ["profiletypesget"],
      insert: ["profiletypesedit"],
      update: ["profiletypesedit"],
      delete: ["profiletypesedit"]
    }
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.post("/list", Permission.permissionRequired(false), this.getByList);
    this.router.get("/all", Permission.permissionRequired(true), this.getAllWithDependency);
  }

  getByList = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByList(req.body.profileTypeIds).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getAllWithDependency = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getAllWithDependency().then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const profileTypeController = new ProfileTypesController();

export default profileTypeController.router;
