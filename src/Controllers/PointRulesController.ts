import { Request, Response, NextFunction } from "express";
import { PointRulesManager } from "../Logic/Managers/PointRulesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { body } from "express-validator";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { addRules, updateRules, deleteRules } from "../Repositories/Validations/PointRuleValidate";
import { validate } from "../Repositories/Utility/Validator";
export class PointRulesController extends BaseRouter {
  constructor() {
    super(PointRulesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: ["pointrulesget"],
      getById: ["pointrulesget"],
      insert: ["pointrulesedit"],
      update: ["pointrulesedit"],
      delete: ["pointrulesedit"]
    }
    // super.init(validation);
    // const validation = [body('point').notEmpty()];
    validationPolicy.insert = addRules;
    validationPolicy.update = updateRules;
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.post("/all/:pageNumber/:itemsPerPage", Permission.permissionRequired(["pointrulesget"]), this.getByPaging);
    this.router.post("/transaction_wage/", Permission.permissionRequired(true), this.getTransactionWage);
  }

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

  getTransactionWage = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getTransactionWage(
      req.body.pointAmount
    ).then(result => ResponseHandler(res, result, null)).catch(err => {
      ResponseHandler(res, null, err)
    });
  };

}
const pointRulesController = new PointRulesController();

export default pointRulesController.router;
