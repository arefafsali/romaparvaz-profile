import { Request, Response, NextFunction } from "express";
import { UserProfilesManager } from "../Logic/Managers/UserProfilesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { getByRoleListRules, updateAsseignedRoleRules } from "../Repositories/Validations/UserProfilesValidate";
import { validate } from "../Repositories/Utility/Validator"
export class UserProfilesController extends BaseRouter {
  constructor() {
    super(UserProfilesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: true,
      getById: true,
      insert: true,
      update: true,
      delete: true
    }
    super.init(permissionPoilicy);
    this.router.get("/me", Permission.permissionRequired(true), this.getMe);
    this.router.get("/get_count_by_role/:roleId", Permission.permissionRequired(true), this.getCountByRole);
    this.router.post("/role_list", Permission.permissionRequired(["userprofilesget"]), getByRoleListRules, validate, this.getByRoleList);
    this.router.get(
      "/user/:userId/:profileId",
      Permission.permissionRequired(["userprofilesget"]),
      this.getByUserId
    );
    this.router.put(
      "/assign_role",
      Permission.permissionRequired(["userprofilesedit"]),
      updateAsseignedRoleRules,
      validate,
      this.updateAsseignedRole
    );
    this.router.get(
      "/users_by_business/:profileId",
      Permission.permissionRequired(["getbusinessusers"]),
      this.getUsersByBusinessProfile
    );
    this.router.get(
      "/employee_by_me",
      Permission.permissionRequired(true),
      this.getEmployeesByBusinessProfileMe
    );
  }

  getMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findMe(req["user"]).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByUserId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByUserId(
      req.params.userId,
      req.params.profileId
    ).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getCountByRole = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getCountByRole(req.params.roleId).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByRoleList = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByRoleList(req.body.roleIds).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  updateAsseignedRole = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateAsseignedRole(req.body).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getUsersByBusinessProfile = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.manager.getUsersByBusinessProfile(
      req.params.profileId).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getEmployeesByBusinessProfileMe = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.manager.getEmployeesByBusinessProfileMe(
      req["user"]).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const userProfilesController = new UserProfilesController();

export default userProfilesController.router;
