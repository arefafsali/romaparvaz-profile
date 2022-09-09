import { Request, Response, NextFunction } from "express";
import { CreditsManager } from "../Logic/Managers/CreditsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { creditAddRule, creditDeleteRule, creditUpdateRule, creditGetRule, creditClearRule, creditGetByProfileRule } from "../Repositories/Validations/creditValidate";
import { validate } from "../Repositories/Utility/Validator";

export class CreditsController extends BaseRouter {
  manager: CreditsManager;

  constructor() {
    super(CreditsManager);
    this.init();
  }
  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy.get = ["creditsget"]
    permissionPoilicy.getById = ["creditsget"]
    permissionPoilicy.insert = ["creditsadd"]
    permissionPoilicy.update = ["creditsedit"]
    permissionPoilicy.delete = ["creditsdelete"]
    let validationPolicy = new ValidationPolicy();
    validationPolicy.insert = creditAddRule;
    validationPolicy.update = creditUpdateRule;
    validationPolicy.delete = creditDeleteRule;
    super.init(permissionPoilicy, validationPolicy);
    this.router.get("/all/:pageNumber/:itemsPerPage", Permission.permissionRequired(["creditsget"]), this.getByPaging);
    this.router.get("/profile_credits/:profileId/:pageNumber/:itemsPerPage", Permission.permissionRequired(["creditsget"]), this.getByProfileId);
    this.router.post("/profile_credits_me/:pageNumber/:itemsPerPage", creditGetByProfileRule, validate, Permission.permissionRequired(true), this.getByProfileIdMe);
    this.router.get("/recalculate/:profileId", Permission.permissionRequired(["creditsget"]), this.recalculateCredit);
    this.router.get("/recalculate_me", Permission.permissionRequired(true), this.recalculateCreditMe);
    this.router.get("/all_credits_summary/:profileId", Permission.permissionRequired(["creditsget"]), this.getProfileAllCreditsSummary);
    this.router.get("/all_credits_summary_me", Permission.permissionRequired(true), this.getProfileAllCreditsSummaryMe);
    this.router.get("/credit_expenses/:id/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getCreditExpensesByCreditId);
    this.router.post("/active_credits/:pageNumber/:itemsPerPage", creditGetRule, validate, Permission.permissionRequired(["creditsget"]), this.getActiveCredits);
    this.router.get("/active_credits_summary", Permission.permissionRequired(["creditsget"]), this.getAllActiveCreditsSummary);
    this.router.post("/paid_expired_credits/:pageNumber/:itemsPerPage", creditGetRule, validate, Permission.permissionRequired(["creditsget"]), this.getPaidOrExpiredCredits);
    this.router.post("/clear_expired_credit", creditClearRule, validate, Permission.permissionRequired(["creditsclear"]), this.clearCredit)
    this.router.post("/insert_deactivate_zero_credit", creditAddRule, validate, Permission.permissionRequired(["creditsget"]), this.createAndDeactivateZeroCredit)
    this.router.get("/expire_credit/:id", Permission.permissionRequired(["creditsexpire"]), this.expireCredit)
    this.router.post("/booking_block", Permission.permissionRequired(['internalapi']), this.blockCreditForBooking)
    this.router.post("/booking_pay", Permission.permissionRequired(['internalapi']), this.payCreditForBooking)
    this.router.get("/booking_unblock/:bookingId/:profileId", Permission.permissionRequired(['internalapi']), this.unBlockCreditForBooking)
  }

  add = (manager: CreditsManager, req: Request, res: Response, next: NextFunction) => {
    manager.create(req.body, req["user"].userId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  createAndDeactivateZeroCredit = (req: Request, res: Response, next: NextFunction) => {
    this.manager.createAndDeactivateZeroCredit(req.body, req["user"].userId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => { console.log(err); ResponseHandler(res, null, err) });
  }

  getByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByPaging(req.params.pageNumber, req.params.itemsPerPage).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(parseInt(req.params.profileId), {}, req.params.pageNumber, req.params.itemsPerPage).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByProfileIdMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(req["user"].activeProfileId, req.body, req.params.pageNumber, req.params.itemsPerPage).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  recalculateCredit = (req: Request, res: Response, next: NextFunction) => {
    this.manager.recalculateCredit(parseInt(req.params.profileId))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  recalculateCreditMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.recalculateCredit(req["user"].activeProfileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getProfileAllCreditsSummary = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getProfileAllCreditsSummary(parseInt(req.params.profileId))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getProfileAllCreditsSummaryMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getProfileAllCreditsSummary(req["user"].activeProfileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getCreditExpensesByCreditId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getCreditExpensesByCreditId(req["user"].activeProfileId, req.params.id, parseInt(req.params.pageNumber), parseInt(req.params.itemsPerPage))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getActiveCredits = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getActiveCredits(req.body, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getPaidOrExpiredCredits = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getPaidOrExpiredCredits(req.body, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getAllActiveCreditsSummary = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getAllActiveCreditsSummary()
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  clearCredit = (req: Request, res: Response, next: NextFunction) => {
    this.manager.clearCredit(req.body, req["user"].userId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  expireCredit = (req: Request, res: Response, next: NextFunction) => {
    this.manager.expireCredit(req.params.id)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  blockCreditForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.blockCreditForBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  payCreditForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.payCreditForBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  unBlockCreditForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.unBlockCreditForBooking(req.params.bookingId, parseInt(req.params.profileId))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
}
const creditsController = new CreditsController();

export default creditsController.router;
