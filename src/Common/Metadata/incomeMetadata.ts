import { body } from "express-validator";

export class income {
  constructor() { }
  public id: number = 0;
  public amount: number = 0;
  public bookingFlightId: string = "";
  public serviceTypeCode: number = 0;
  public walletId: number = 0;
  public creditExpenseId: number = 0;
  public profilePointId: number = 0
}
export class flatIncome {
  constructor() { }
  public id: number = 0;
  public amount: number = 0;
  public bookingFlightId: string = "";
  public serviceTypeCode: number = 0;
}

export class incomeValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static amount: any = body('amount').isInt().exists().notEmpty().withMessage("Not a valid amount!!(must be numeric and not empty)");
  static bookingFlightId: any = body('bookingFlightId').isString().withMessage("Not a valid bookingFlightId!!(must be string)");
  static serviceTypeCode: any = body('serviceTypeCode').isInt().withMessage("Not a valid serviceTypeCode!!(must be numeric)");
  static walletId: any = body('walletId').isInt().withMessage("Not a valid walletId!!(must be numeric)");
  static profilePointId: any = body('profilePointId').isInt().withMessage("Not a valid profilePointId!!(must be numeric)");
}