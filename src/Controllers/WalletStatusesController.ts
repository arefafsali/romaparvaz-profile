import { Request, Response, NextFunction } from "express";
import { WalletStatusesManager } from "../Logic/Managers/WalletStatusesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";

export class WalletStatusesController extends BaseRouter {
  manager: WalletStatusesManager;

  constructor() {
    super(WalletStatusesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy.get = false
    permissionPoilicy.getById = false
    permissionPoilicy.insert = ["internalapi"]
    permissionPoilicy.update = ["internalapi"]
    permissionPoilicy.delete = ["internalapi"]
    let validationPolicy = new ValidationPolicy();
    // validationPolicy.insert = walletAddRule;
    // validationPolicy.update = walletUpdateRule;
    // validationPolicy.delete = walletDeleteRule;
    super.init(permissionPoilicy, validationPolicy);
  }
}
const walletStatusesController = new WalletStatusesController();

export default walletStatusesController.router;
