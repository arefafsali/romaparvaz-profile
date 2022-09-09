import { Request, Response, NextFunction } from "express";
import { JWTsManager } from "../Logic/Managers/JWTsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { UserProfilesManager } from "../Logic/Managers/UserProfilesManager";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { HTTPStatusCode } from "../Repositories/Utility/HttpStatusCode";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";

export class JWTsController extends BaseRouter {
  constructor() {
    super(JWTsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: false,
      getById: false,
      insert: false,
      update: false,
      delete: false
    }
    super.init(permissionPoilicy);
    this.router.get("/current_user", Permission.permissionRequired(true), this.getCurrentUser);
    this.router.get("/signout", Permission.permissionRequired(true), this.signout);
    this.router.get("/check_permission/:permission_name/:profile_id", Permission.permissionRequired(true), this.checkPermission);
    this.router.get("/check_role/:role_name", Permission.permissionRequired(true), this.checkRole);
    this.router.post("/check_permission_list", Permission.permissionRequired(true), this.checkPermissionList);
  }

  getCurrentUser = (req: Request, res: Response, next: NextFunction) => {
    if (req["user"]) ResponseHandler(res, req["user"], null)
    else ResponseHandler(res, null, { error: {}, errMessage: "User not loggedin!", statusCode: 500 })
  };

  signout = (req: Request, res: Response, next: NextFunction) => {
    if (req["user"]) {
      this.manager.signout(req["user"]).then(result => ResponseHandler(res.clearCookie("token"), result, null))
        .catch(err => ResponseHandler(res, null, err));
      // .catch(err => res.status(500).send(err));
    } else ResponseHandler(res, null, { error: {}, errMessage: "User not loggedin!", statusCode: 500 })
  };

  checkPermission = (req: Request, res: Response, next: NextFunction) => {
    if (req["user"]) {
      new UserProfilesManager().checkPermission(
        req["user"],
        parseInt(req.params.profile_id),
        req.params.permission_name,
      )
        .then(result => ResponseHandler(res, result, null))
        .catch(err => ResponseHandler(res, null, err)
          // ResponseHandler(res, null, { error: err, errMessage: "User not loggedin!", statusCode: 500 })
        );
    }
    else
      ResponseHandler(res, null, { error: {}, errMessage: "User not loggedin!", statusCode: 500 })
  }

  checkRole = (req: Request, res: Response, next: NextFunction) => {
    if (req["user"]) {
      new UserProfilesManager().checkRole(
        req["user"],
        req.params.role_name,
      )
        .then(result => {
          if (result)
            ResponseHandler(res, { user: req["user"], role_check: result }, null)
          else ResponseHandler(res, { role_check: result }, null)
        })
        .catch(err =>
          ResponseHandler(res, null, { error: {}, errMessage: "User not loggedin!", statusCode: 500 })
        );
    };
  }

  checkPermissionList = (req: Request, res: Response, next: NextFunction) => {
    if (req["user"]) {
      new UserProfilesManager().checkPermissionList(req["user"], req.body)
        .then(result => {
          let response = { permission_result: result, user: null };
          if (result)
            response.user = req["user"];
          ResponseHandler(res, response, null)
        })
        .catch(err => ResponseHandler(res, null, { error: {}, errMessage: "User not loggedin!", statusCode: 500 }))
    }
    else
      ResponseHandler(res, null, { error: {}, errMessage: "User not loggedin!", statusCode: 500 })
  }
}
const jWTsController = new JWTsController();

export default jWTsController.router;
