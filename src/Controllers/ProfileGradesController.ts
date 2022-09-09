import { Request, Response, NextFunction } from "express";
import { ProfileGradesManager } from "../Logic/Managers/ProfileGradesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { Permission } from "../Repositories/Utility/Permission";

export class ProfileGradesController extends BaseRouter {
  constructor() {
    super(ProfileGradesManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["profilegradesget"],
      getById: ["profilegradesget"],
      insert: ["profilegradesedit"],
      update: ["profilegradesedit"],
      delete: ["profilegradesedit"]
    }
    super.init(permissionPoilicy);
    this.router.post("/all/:pageNumber/:itemsPerPage", Permission.permissionRequired(["profilegradesget"]), this.getByPaging);
  }

  getByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByPaging(req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getAll = (manager: any, req: Request, res: Response, next: NextFunction) => {
    manager.find({ order: [["code", "ASC"]] }).then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };
}
const profileGradesController = new ProfileGradesController();

export default profileGradesController.router;
