import { oneOf, body } from "express-validator";
import { dateValidation } from "../../Repositories/Utility/dateValidation";

export class wallet {
  constructor() { }
  public id: number = 0;
  public guid: string = "";
  public profileId: number = 0;
  public amount: number = 0;
  public walletStatusId: number = 0;
  public description: string = "";
  public bookingId: string = "";
  public paymentData: object = null;
  public userId: number = 0;
  public currencyId: string = "";
}

export class walletValidate {
  constructor() { }
  static id = oneOf([body("id").isInt().withMessage("Not a valid id!!(must be string or numeric)"), body("id").isString().withMessage("Not a valid id!!(must be string or numeric)")])
  static guid = body('guid').isString().withMessage("Not a valid guid!!(must be numeric)");
  static profileId = body('profileId').isInt().custom(value => value > 0).withMessage("Not a valid profileId!!(must be a positive number)");
  static amount = body('amount').isFloat().custom(value => value > 0).withMessage("Not a valid amount!!(must be a positive number)");
  static walletStatusId = body('walletStatusId').isInt().withMessage("Not a valid walletStatusId!!(must be numeric)");
  static description = body('description').isString().optional().withMessage("Not a valid description!!(must be numeric)");
  static bookingId = body('bookingId').isString().optional().withMessage("Not a valid bookingId!!(must be numeric)");
  static userId = body('userId').isInt().withMessage("Not a valid userId!!(must be numeric)");
  static currencyId = body('currencyId').isString().withMessage("Not a valid currencyId!!(must be numeric)");
  static startDate = body('startDate').custom(dateValidation).withMessage("Not a valid date!!");
  static endDate = body('endDate').custom(dateValidation).withMessage("Not a valid date!!");
}