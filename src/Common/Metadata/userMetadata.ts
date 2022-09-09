import { body, check } from "express-validator";
export class user {
  constructor() { }
  public id: number = 0;
  public userName: string = "";
  public password: string = "";
  public guid: string = "";
  public isActive: boolean = false;
  public individualProfileId: number = 0;
  public secondPassword: string = "";
}
export class userFlat {
  constructor() { }
  public id: number = 0;
  public userName: string = "";
  public guid: string = "";
  public isActive: boolean = false;
  public individualProfileId: number = 0;
}

export class userValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static idForUpdateAndDelete: any = body('id').exists().isInt().notEmpty().withMessage("Not a valid id!!(must be numeric)")
  static userName: any = body('userName').isEmail().withMessage("Not a valid userName!!(must be valid email format)");
  static phrase: any = body('phrase').isString().optional().withMessage("Not a valid phrase!!(must be string)");
  static password: any = body('password').isLength({ min: 5 }).withMessage("Not a valid password!!(must contain at least five characters)");
  static secondPassword: any = body('secondPassword').isLength({ min: 5 }).withMessage("Not a valid secondPassword! !(must contain at least five characters)");
  static oldPassword: any = body('oldPassword').isLength({ min: 5 }).withMessage("Not a valid oldPassword!!(must contain at least five characters)");
  static firstName: any = body('firstName').isString().notEmpty().withMessage("Not a valid firstName!!(must be string and not empty)");
  static lastName: any = body('lastName').isString().notEmpty().withMessage("Not a valid lastName!!(must be string and not empty)");
  static email: any = body('email').isEmail().notEmpty().withMessage("Not a valid email!!(must be valid email format)");
  static profileId: any = body('profileId').isInt().notEmpty().withMessage("Not a valid profileId!!(must be numeric)");
  static departmentId: any = body('departmentId').isInt().notEmpty().withMessage("Not a valid departmentId!!(must be integer and not empty)");
  static guid: any = body('guid').isString().notEmpty().withMessage("Not a valid uuid!!(must be string and not empty)");
  static hash: any = body('hash').isString().withMessage("Not a valid hash!!(must be string)");
  static isInclude: any = body('isInclude').isBoolean().withMessage("Not a valid isInclude!!(must be boolean)");
  static isActive: any = body('isActive').isBoolean().withMessage("Not a valid isActive!!(must be boolean)");
  static orderType: any = body('orderType').isString().optional().withMessage("Not a valid orderType!!(must be string)");
  static column: any = body('column').isString().withMessage("Not a valid column!!(must be string)");
  static day: any = body('day').isString().optional().withMessage("Not a valid day!!(must be string)");
  static month: any = body('month').isString().optional().withMessage("Not a valid month!!(must be string)");
  static year: any = body('year').isString().optional().withMessage("Not a valid year!!(must be string)");
  static gender: any = body('gender').isInt().optional().withMessage("Not a valid gender!!(must be numeric)");
  static nationalCode: any = body('nationalCode').isString().optional().withMessage("Not a valid nationalCode!!(must be numeric)");
  static mobile: any = body('basicInfo.mobile').isString().withMessage("Not a valid mobile!!(must be string)");
  static mobileWithoutCode: any = body('basicInfo.mobileWithoutCode').isString().withMessage("Not a valid mobileWithoutCode!!(must be string)");
  static countryAbr: any = body('basicInfo.countryAbr').isString().notEmpty().withMessage("Not a valid countryAbr!!(must be string and not empty)");
  static avatar: any = body('basicInfo.avatar').isString().withMessage("Not a valid avatar!!(must be string )");
  static identityNo: any = body('identityNo').isString().optional().withMessage("Not a valid identityNo!!(must be string)");
  static passportNo: any = body('passportNo').isString().optional().withMessage("Not a valid passportNo!!(must be string)");
  static address: any = body('address').isString().optional().withMessage("Not a valid address!!(must be string)");
  static googleId: any = body('googleId').isString().withMessage("Not a valid googleId!!(must be string)");

  static basicInfoForAddEmpolye: any = [
    userValidate.day,
    userValidate.month,
    userValidate.year,
    userValidate.gender,
    userValidate.nationalCode,
    userValidate.identityNo,
    userValidate.passportNo,
    userValidate.mobile,
    userValidate.mobileWithoutCode,
    userValidate.countryAbr,
    userValidate.avatar,
  ]

  static basicInfo: any = [
    userValidate.mobileWithoutCode,
    userValidate.mobile,
    userValidate.countryAbr,
    userValidate.avatar,
    userValidate.address,
  ]

  static basicInfoForGoogle: any = [
    userValidate.googleId,
  ]

  static roles: any = body('roles').custom(value => {
    if (value.some(x => Number.isInteger(x))) return true;
    return false;
  }).withMessage("Not a valid roles!!(must be array of integer)");
}