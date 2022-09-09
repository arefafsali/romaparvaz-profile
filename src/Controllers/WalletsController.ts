import { Request, Response, NextFunction } from "express";
import { WalletsManager } from "../Logic/Managers/WalletsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { walletAddRule, walletDeleteRule, walletUpdateRule, walletHistoryFilterRule, walletChargeRule } from "../Repositories/Validations/walletValidate";
import { ExternalRequest } from "../Infrastructure/ExternalRequests";
import { validate } from "../Repositories/Utility/Validator";

export class WalletsController extends BaseRouter {
  manager: WalletsManager;

  constructor() {
    super(WalletsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy.get = ["walletsget"]
    permissionPoilicy.getById = ["walletsget"]
    permissionPoilicy.insert = ["internalapi"]
    permissionPoilicy.update = ["internalapi"]
    permissionPoilicy.delete = ["internalapi"]
    let validationPolicy = new ValidationPolicy();
    validationPolicy.insert = walletAddRule;
    validationPolicy.update = walletUpdateRule;
    validationPolicy.delete = walletDeleteRule;
    super.init(permissionPoilicy, validationPolicy);

    this.router.post("/charge", walletChargeRule, validate, Permission.permissionRequired(true), this.chargeWallet)
    this.router.post("/charge_cancelled_booking", Permission.permissionRequired(["internalapi"]), this.chargeWalletCancelledBooking)
    this.router.post("/failed_payment/:guid", Permission.permissionRequired(true), this.failedPayment)
    this.router.post("/success_payment/:guid", Permission.permissionRequired(true), this.successPayment)
    this.router.post("/history/:pageNumber/:itemsPerPage", walletHistoryFilterRule, validate, Permission.permissionRequired(true), this.getProfileWalletHistory)
    this.router.get("/recalculate", Permission.permissionRequired(true), this.recalculateWallet)
    this.router.post("/booking_block", Permission.permissionRequired(['internalapi']), this.blockWalletForBooking)
    this.router.post("/booking_pay", Permission.permissionRequired(['internalapi']), this.payWalletForBooking)
    this.router.get("/booking_unblock/:bookingId/:profileId", Permission.permissionRequired(['internalapi']), this.unBlockWalletForBooking)
  }

  chargeWallet = (req: Request, res: Response, next: NextFunction) => {
    this.manager.chargeWallet(req["user"].activeProfileId, req["user"].userId, req.body)
      .then(result => {
        return ExternalRequest.syncPostRequest(process.env.MAIN_URL + "pg/wallet_request", {
          walletId: result.id,
          walletGuid: result.guid,
          totalPrice: result.amount,
          profileId: result.profileId
        })
      })
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  chargeWalletCancelledBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.chargeWalletCancelledBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  failedPayment = (req: Request, res: Response, next: NextFunction) => {
    this.manager.failedPayment(req.params.guid, req.body)
      .then(result => ResponseHandler(res, { status: "success" }, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  successPayment = (req: Request, res: Response, next: NextFunction) => {
    this.manager.successPayment(req.params.guid, req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  getProfileWalletHistory = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getWalletHistory(req["user"].activeProfileId, req.body, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  recalculateWallet = (req: Request, res: Response, next: NextFunction) => {
    this.manager.recalculateWallet(req["user"].activeProfileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  blockWalletForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.blockWalletForBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  payWalletForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.payWalletForBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  unBlockWalletForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.unBlockWalletForBooking(req.params.bookingId, parseInt(req.params.profileId))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
}
const walletsController = new WalletsController();

export default walletsController.router;
