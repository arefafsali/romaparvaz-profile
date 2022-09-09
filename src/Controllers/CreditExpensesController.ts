import { Request, Response, NextFunction } from "express";
import { CreditExpensesManager } from "../Logic/Managers/CreditExpensesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";

export class CreditExpensesController extends BaseRouter {
  manager: CreditExpensesManager;

  constructor() {
    super(CreditExpensesManager);
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
    // validationPolicy.insert = creditAddRule;
    // validationPolicy.update = creditUpdateRule;
    // validationPolicy.delete = creditDeleteRule;
    super.init(permissionPoilicy, validationPolicy);
  }
}
const creditExpensesController = new CreditExpensesController();

export default creditExpensesController.router;
