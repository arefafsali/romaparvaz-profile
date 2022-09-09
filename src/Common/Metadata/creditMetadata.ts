import { oneOf, body, ValidationChain } from "express-validator";
import { Middleware } from "express-validator/src/base";
import { dateValidation } from "../../Repositories/Utility/dateValidation";

export class credit {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public amount: number = 0;
  public currencyId: string = "";
  public creditStatusId: number = 0;
  public expireDate: Date = null;
  public period: number = 0;
  public operatorId: number = 0;
}

export class creditValidate {
  constructor() { }
  static id: Middleware = oneOf([body("id").isInt().withMessage("Not a valid id!!(must be string or numeric)"), body("id").isString().withMessage("Not a valid id!!(must be string or numeric)")])
  static profileId: ValidationChain = body('profileId').isInt().custom(value => value > 0).withMessage("Not a valid profileId!!(must be a positive number)");
  static amount: ValidationChain = body('amount').isFloat().custom(value => value > 0).withMessage("Not a valid amount!!(must be a positive number)");
  static currencyId: ValidationChain = body('currencyId').isString().withMessage("Not a valid currencyId!!(must be numeric)");
  static creditStatusId: ValidationChain = body('creditStatusId').isInt().withMessage("Not a valid creditStatusId!!(must be numeric)");
  static expireDate: ValidationChain = body('expireDate').custom(value => {
    if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    const date = new Date(value);
    if (!date.getTime()) return false;
    return date.toISOString().slice(0, 10) === value;
  }).withMessage("Not a valid expireDate!!");
  static period: ValidationChain = body('period').isInt().custom(value => value > 0).withMessage("Not a valid period!!(must be a positive number)");
  static operatorId: ValidationChain = body('operatorId').isInt().withMessage("Not a valid operatorId!!(must be numeric)");
  static phrase: any = body('phrase').isString().optional().withMessage("Not a valid phrase!!(must be string)");
  static creditStatusCode: any = body('creditStatusCode').isString().optional().withMessage("Not a valid creditStatusCode!!(must be string)");
  static addCredit: any = body('addCredit').isBoolean().withMessage("Not a valid addCredit!!(must be boolean )");
  static createdStartDate = body('createdStartDate').custom(dateValidation).withMessage("Not a valid createdStartDate!!");
  static createdEndDate = body('createdEndDate').custom(dateValidation).withMessage("Not a valid createdEndDate!!");
  static expieryStartDate = body('expieryStartDate').custom(dateValidation).withMessage("Not a valid expieryStartDate!!");
  static expieryEndDate = body('expieryEndDate').custom(dateValidation).withMessage("Not a valid expieryEndDate!!");
}