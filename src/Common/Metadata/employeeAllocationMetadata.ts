import { oneOf, body } from "express-validator";

export class employeeAllocation {
  constructor() { }
  public id: number = 0;
  public ownerProfileId: number = 0;
  public profileId: number = 0;
  public amount: number = 0;
  public currencyId: string = "";
  public employeeAllocationStatusId: number = 0;
  public expireDate: Date = null;
  public period: number = 0;
  public userId: number = 0;
}

export class employeeAllocationAmount {
  constructor() { }
  public total: number = 0;
  public remain: number = 0;
  public blocked: number = 0;
}

export class employeeAllocationValidate {
  constructor() { }
  static id = oneOf([body("id").isInt().withMessage("Not a valid id!!(must be string or numeric)"), body("id").isString().withMessage("Not a valid id!!(must be string or numeric)")])
  static ownerProfileId = body('ownerProfileId').isInt().custom(value => value > 0).withMessage("Not a valid ownerProfileId!!(must be a positive number)");
  static profileId = body('profileId').isInt().custom(value => value > 0).withMessage("Not a valid profileId!!(must be a positive number)");
  static amount = body('amount').isFloat().custom(value => value > 0).withMessage("Not a valid amount!!(must be a positive number)");
  static currencyId = body('currencyId').isString().withMessage("Not a valid currencyId!!(must be numeric)");
  static employeeAllocationStatusId = body('employeeAllocationStatusId').isInt().withMessage("Not a valid employeeAllocationStatusId!!(must be numeric)");
  static expireDate = body('expireDate').custom(value => {
    if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    const date = new Date(value);
    if (!date.getTime()) return false;
    return date.toISOString().slice(0, 10) === value;
  }).withMessage("Not a valid expireDate!!");
  static period = body('period').isInt().custom(value => value > 0).withMessage("Not a valid period!!(must be a positive number)");
  static userId = body('userId').isInt().withMessage("Not a valid userId!!(must be numeric)");
  static phrase = body('phrase').isString().optional().withMessage("Not a valid phrase!!(must be string)");
  static employeeAllocationStatusCode = body('employeeAllocationStatusCode').isString().optional().withMessage("Not a valid employeeAllocationStatusCode!!(must be string)");
  static addEmployeeAllocation = body('addEmployeeAllocation').isBoolean().withMessage("Not a valid addEmployeeAllocation!!(must be boolean )");
}