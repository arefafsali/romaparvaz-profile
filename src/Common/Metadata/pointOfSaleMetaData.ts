import { body } from "express-validator";
export class pointOfSale {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public parentId: number = 0;
  public incomeId: number = 0;
  public amount: number = 0;
  public withdrawDate: Date = null;
  public withdrawTypeId: number = 0;
  public gatewayId: string = "";
}
export class flatPointOfSale {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public parentId: number = 0;
  public incomeId: number = 0;
  public amount: number = 0;
  public withdrawDate: Date = null;
  public withdrawTypeId: number = 0;
  public gatewayId: string = "";
}

export class pointOfSaleValidate {
  constructor() { }
  static profileId: any = body('profileId').isInt().withMessage("Not a valid profileId!!(must be numeric)");
  static startDate: any = body('startDate').isString().withMessage("Not a valid startDate!!(must be string)");
  static endDate: any = body('endDate').isString().withMessage("Not a valid endDate!!(must be string)");
  static isWithdraw: any = body('isWithdraw').isBoolean().withMessage("Not a valid isWithdraw!!(must be boolean)");
}