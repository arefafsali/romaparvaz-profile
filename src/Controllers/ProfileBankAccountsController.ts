import { Request, Response, NextFunction } from "express";
import { ProfileBankAccountsManager } from "../Logic/Managers/ProfileBankAccountsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { createMeRules } from "../Repositories/Validations/ProfileBankAccountValidate";
import { validate } from "../Repositories/Utility/Validator";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";

export class BusinessTypesController extends BaseRouter {
  constructor() {
    super(ProfileBankAccountsManager);
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
    // const validation = [body('bankName').notEmpty()];
    // super.init(validation);
    super.init(permissionPoilicy);
    this.router.get("/profile/:profileId", Permission.permissionRequired(true), this.getByProfileId);
    this.router.get("/me/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByMe);
    this.router.post("/me", Permission.permissionRequired(true), createMeRules, validate, this.createMe);
  }

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByProfileId(req.params.profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByMe(req["user"],
        req.params.pageNumber,
        req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  createMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .createMe(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const businessTypesController = new BusinessTypesController();

export default businessTypesController.router;
