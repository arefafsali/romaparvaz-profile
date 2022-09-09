import { body } from "express-validator";
export class profileBankAccount {
  constructor() { }
  public id: number = 0;
  public bankName: string = "";
  public branchName: string = "";
  public accountNo: string = "";
  public cardNo: string = "";
  public shebaNo: string = "";
  public isDefault: boolean = false;
  public profileId: number = 0;
}
export class flatPofileBankAccount {
  constructor() { }
  public id: number = 0;
  public bankName: string = "";
  public branchName: string = "";
  public accountNo: string = "";
  public cardNo: string = "";
  public shebaNo: string = "";
  public isDefault: boolean = false;
  public profileId: number = 0;
  public bankAccountTypeId: string = "";
  public countryId: string = "";
}

export class profileBankAccountValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static bankName: any = body('bankName').isString().optional().withMessage("Not a valid bankName!!(must be string)");
  static accountNo: any = body('accountNo').isString().withMessage("Not a valid accountNo!!(must be string)");
  static shebaNo: any = body('shebaNo').isString().withMessage("Not a valid shebaNo!!(must be string and contain at least three characters)");
  static isDefault: any = body('isDefault').isBoolean().withMessage("Not a valid isDefault!!(must be  boolean)");
  static cardNo: any = body('cardNo').isString().withMessage("Not a valid cardNo!!(must be string)");
  static branchName: any = body('branchName').isString().optional().withMessage("Not a valid branchName!!(must be string)");
}