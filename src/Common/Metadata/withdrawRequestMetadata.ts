import { body } from "express-validator";

export class withdrawRequest {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public requestAmount: number = 0;
  public requestDate: Date = null;
  public isApproved: boolean = false;
  public profileBankAccountId: number = 0;
  public withdrawTypeId: number = 0;
  public description: string = "";
  public isPay: boolean = false;
}
export class flatWithdrawRequest {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public requestAmount: number = 0;
  public requestDate: Date = null;
  public isApproved: boolean = false;
  public profileBankAccountId: number = 0;
  public withdrawTypeId: number = 0;
  public description: string = "";
  public isPay: boolean = false;
}

export class withdrawRequestValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static idForUpdateAndDelete: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric and not empty)");
  static isApproved: any = body('isApproved').isBoolean().withMessage("Not a valid isApproved!!(must be boolean)");
  static requestAmount: any = body('requestAmount').isNumeric().withMessage("Not a valid requestAmount!!(must be numeric)");
  static profileBankAccountId: any = body('profileBankAccountId').isNumeric().withMessage("Not a valid profileBankAccountId!!(must be numeric)");
  static description: any = body('description').isString().withMessage("Not a valid description!!(must be string)");
}