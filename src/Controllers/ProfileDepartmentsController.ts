import { Request, Response, NextFunction } from "express";
import { ProfileDepartmentsManager } from "../Logic/Managers/ProfileDepartmentsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { body } from "express-validator";
export class ProfileDepartmentsController extends BaseRouter {
  constructor() {
    super(ProfileDepartmentsManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["profiledepartmentsget"],
      getById: ["profiledepartmentsget"],
      insert: ["profiledepartmentsedit"],
      update: ["profiledepartmentsedit"],
      delete: ["profiledepartmentsedit"]
    }
    super.init(permissionPoilicy);
    this.router.get(
      "/profile_all/:profileId/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["profiledepartmentsget"]),
      this.getByProfileId
    );
    // const validation = [body('code').notEmpty(), body('name').notEmpty()];
    // super.init(validation);
  }

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(
      req.params.profileId,
      req.params.pageNumber,
      req.params.itemsPerPage
    ).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const profileDepartmentsController = new ProfileDepartmentsController();

export default profileDepartmentsController.router;
