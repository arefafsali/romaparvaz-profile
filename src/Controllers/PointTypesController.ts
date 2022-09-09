import { Request, Response, NextFunction } from "express";
import { PointTypesManager } from "../Logic/Managers/PointTypesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";

export class PointTypesController extends BaseRouter {
  constructor() {
    super(PointTypesManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["pointtypesget"],
      getById: ["pointtypesget"],
      insert: ["pointtypesedit"],
      update: ["pointtypesedit"],
      delete: ["pointtypesedit"]
    }
    super.init(permissionPoilicy);
    this.router.get("/get_by_code/:code", Permission.permissionRequired(false), this.getByCode);
    this.router.post("/all/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByPaging);
  }
  getByCode = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByCode(req.params.code)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      })
  };
  getByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByPaging(
      req.params.pageNumber,
      req.params.itemsPerPage,
      req.body.filter,
      req.body.sort
    ).then(result => ResponseHandler(res, result, null)).catch(err => {
      ResponseHandler(res, null, err)
    });
  };
}
const commissionTypesController = new PointTypesController();

export default commissionTypesController.router;
