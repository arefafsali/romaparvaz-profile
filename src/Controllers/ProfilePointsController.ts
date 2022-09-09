import { Request, Response, NextFunction } from "express";
import { ProfilePointsManager } from "../Logic/Managers/ProfilePointsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";

export class ProfilePointsController extends BaseRouter {
  constructor() {
    super(ProfilePointsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: true,
      getById: true,
      insert: ["backendapi"],
      update: ["backendapi"],
      delete: ["backendapi"]
    }
    super.init(permissionPoilicy);
    this.router.get("/me", Permission.permissionRequired(true), this.getMe);
    this.router.post("/profile_all/:profileId/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByProfileId);
    this.router.post("/booking_block", Permission.permissionRequired(['internalapi']), this.blockPointForBooking)
    this.router.post("/booking_pay", Permission.permissionRequired(['internalapi']), this.payPointForBooking)
    this.router.get("/booking_unblock/:bookingId/:profileId", Permission.permissionRequired(['internalapi']), this.unBlockPointForBooking)
    this.router.get("/status", Permission.permissionRequired(true), this.calculatePointStatus)
    this.router.post("/transfer", Permission.permissionRequired(true), this.transferPoints)
  }

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(parseInt(req.params.profileId), req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort,)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => { ResponseHandler(res, null, err) });
  };

  getMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getMe(req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => { ResponseHandler(res, null, err) });
  };

  blockPointForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.blockPointForBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  payPointForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.payPointForBooking(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  unBlockPointForBooking = (req: Request, res: Response, next: NextFunction) => {
    this.manager.unBlockPointForBooking(req.params.bookingId, parseInt(req.params.profileId))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  calculatePointStatus = (req: Request, res: Response, next: NextFunction) => {
    this.manager.calculatePointStatus(req["user"].profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => { ResponseHandler(res, null, err) });
  }

  transferPoints = (req: Request, res: Response, next: NextFunction) => {
    this.manager.transferPoints(req.body.pointAmount, req.body.senderProfileId, req.body.recieverProfileId, req.body.secondPassword,)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

}
const userPointsController = new ProfilePointsController();

export default userPointsController.router;
