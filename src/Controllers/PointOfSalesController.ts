import { Request, Response, NextFunction } from "express";
import { PointOfSalesManager } from "../Logic/Managers/PointOfSalesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { validate } from "../Repositories/Utility/Validator";
import { getAllIncomeCotaRules, getByMeRules } from "../Repositories/Validations/PointOfSaleValidate";
export class PointOfSalesController extends BaseRouter {
  constructor() {
    super(PointOfSalesManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["pointofsalesget"],
      getById: ["pointofsalesget"],
      insert: ["pointofsalesedit"],
      update: ["pointofsalesedit"],
      delete: ["pointofsalesedit"]
    }
    super.init(permissionPoilicy);
    this.router.post(
      "/get_income_quota/:pageNumber/:itemsPerPage",
      getAllIncomeCotaRules,
      validate,
      Permission.permissionRequired(["pointofsalesget"]),
      this.getAllIncomeCota
    );
    this.router.post(
      "/profile/:profileId/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["profilepointofsale"]),
      this.getByProfileId
    );
    this.router.post(
      "/me/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(true),
      getByMeRules,
      validate,
      this.getByMe
    );
    this.router.get(
      "/business/:profileId/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["profilepointofsale"]),
      this.getByBusinessProfile
    );
  }
  getAllIncomeCota = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getAllIncomeCota(req.body, req.params.pageNumber,
      req.params.itemsPerPage).then(result => ResponseHandler(res, result, null)).catch(err => {
        ResponseHandler(res, null, err)

      });
  };

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(req.body, req.params.profileId, req.params.pageNumber,
      req.params.itemsPerPage).then(result => ResponseHandler(res, result, null)).catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(req.body, req["user"].profileId, req.params.pageNumber,
      req.params.itemsPerPage).then(result => ResponseHandler(res, result, null)).catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByBusinessProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByBusinessProfile(req.params.profileId, req.params.pageNumber, req.params.itemsPerPage).
      then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const pointOfSalesController = new PointOfSalesController();

export default pointOfSalesController.router;
