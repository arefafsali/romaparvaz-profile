import { Request, Response, NextFunction } from "express";
import { WithdrawRequestsManager } from "../Logic/Managers/WithdrawRequestsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { createMeRules, updateApprovedStatusRules, deleteRules } from "../Repositories/Validations/WithdrawRequestsValidate";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { validate } from "../Repositories/Utility/Validator";
export class WithdrawRequestsController extends BaseRouter {
  constructor() {
    super(WithdrawRequestsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: ["withdrawrequestsget"],
      getById: ["withdrawrequestsget"],
      insert: true,
      update: true,
      delete: true
    }
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.post("/me/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getMe);
    this.router.put("/paid/:id", Permission.permissionRequired(true), this.updateIsPay);
    this.router.post("/me", Permission.permissionRequired(true), createMeRules, validate, this.createMe);
    this.router.post("/new/:pageNumber/:itemsPerPage", Permission.permissionRequired(["withdrawrequestsget"]), this.getNewRequests);
    this.router.put("/approve_action", Permission.permissionRequired(["withdrawrequestsedit"]), updateApprovedStatusRules, validate, this.updateApprovedStatus);
    this.router.post("/approved/:pageNumber/:itemsPerPage", Permission.permissionRequired(["withdrawrequestsget"]), this.getApprovedRequest);
    this.router.post("/me_pending", Permission.permissionRequired(true), this.calculatePending);

  }

  getMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getMe(req["user"], req.body.withdrawTypeId, req.params.pageNumber,
        req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  createMe = (req: Request, res: Response, next: NextFunction) => {
    console.log("ss", req.body)
    this.manager
      .createMe(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  updateIsPay = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .updateIsPay(parseInt(req.params.id), req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getNewRequests = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getNewRequests(req["user"], req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  updateApprovedStatus = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .updateApprovedStatus(req["user"], req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getApprovedRequest = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getApprovedRequest(req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
  calculatePending = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .calculatePending(req.body.profileId, req.body.withdrawType)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const withdrawRequestsController = new WithdrawRequestsController();

export default withdrawRequestsController.router;
