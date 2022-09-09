import { Router, Request, Response, NextFunction } from "express";
import { MarkupManager } from "../Logic/Managers/MarkupManager";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
export class MarkupController {
  router: Router;
  manager: MarkupManager;
  constructor() {
    this.router = Router();
    this.manager = new MarkupManager();
    this.init();
  }

  init() {
    this.router.post("/get_markup", Permission.permissionRequired(false), this.getMarkup);
  }

  getMarkup = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getMarkup(req.body.gatewayId, req.body.airlineCodes, req.body.sellerProfileId, req.body.buyerProfileId)
      .then(result => ResponseHandler(res, result, null)).catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const markupContorller = new MarkupController();

export default markupContorller.router;
