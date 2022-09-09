import { oneOf, body, ValidationChain } from "express-validator";
import { Middleware } from "express-validator/src/base";

export class creditExpense {
  constructor() { }
  public id: number = 0;
  public creditId: number = 0;
  public amount: number = 0;
  public currencyId: string = "";
  public creditStatusId: number = 0;
  public bookingId: string = "";
  public userId: number = 0;
}

export class creditExpenseValidate {
  constructor() { }
  static id: Middleware = oneOf([body("id").isInt().withMessage("Not a valid id!!(must be string or numeric)"), body("id").isString().withMessage("Not a valid id!!(must be string or numeric)")])
  static creditId: ValidationChain = body('creditId').isInt().withMessage("Not a valid creditId!!(must be numeric)");
  static amount: ValidationChain = body('amount').isFloat().withMessage("Not a valid amount!!(must be numeric)");
  static currencyId: ValidationChain = body('currencyId').isString().withMessage("Not a valid currencyId!!(must be numeric)");
  static creditStatusId: ValidationChain = body('creditStatusId').isInt().withMessage("Not a valid creditStatusId!!(must be numeric)");
  static bookingId: ValidationChain = body('bookingId').isString().withMessage("Not a valid bookingId!!(must be numeric)");
  static userId: ValidationChain = body('userId').isInt().withMessage("Not a valid userId!!(must be numeric)");
}