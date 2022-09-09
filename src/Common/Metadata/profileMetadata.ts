import { body, check, oneOf } from "express-validator";
export class profile {
  constructor() { }
  public id: number = 0;
  public firstName: string = "";
  public lastName: string = "";
  public displayName: object = null;
  public guid: string = "";
  public isApproved: boolean = null;
  public isActive: boolean = false;
  public isLock: boolean = true;
  public creatorUserId: number = null;
  public operatorUserId: number = null;
  public basicInfo: object = null;
  public addresses: object[] = null;
  public email: string = "";
  public businessTypeId: number = null;
  public profileTypeId: number = null;
  public profileGradeId: number = null;
  public invitedProfiles: object[] = null;
  public walletAmount: walletAmount = null;
  public creditAmount: creditAmount = null;
}

export class walletAmount {
  public remain: number = 0;
  public blocked: number = 0;
  public moneyUnit: object = null;
}

export class creditAmount {
  public total: number = 0;
  public remain: number = 0;
  public blocked: number = 0;
  public moneyUnit: object = null;
}

export class flatProfile {
  constructor() { }
  public id: number = 0;
  public firstName: string = "";
  public lastName: string = "";
  public displayName: object = null;
  public guid: string = "";
  public isApproved: boolean = null;
  public isActive: boolean = false;
  public isLock: boolean = true;
  public creatorUserId: number = null;
  public operatorUserId: number = null;
  public basicInfo: object = null;
  public addresses: object[] = null;
  public email: string = "";
  public businessTypeId: number = null;
  public profileTypeId: number = null;
  public profileGradeId: number = null;
  public invitedProfiles: object[] = null;
}

export class profileValidate {
  constructor() { }
  // “Not a valid 10-digit US phone number (must not include spaces or special characters)”
  static id: any = oneOf([body("id").isInt().withMessage("Not a valid id!!(must be string or numeric)"), body("id").isString().withMessage("Not a valid id!!(must be string or numeric)")])
  static idForDelete: any = body("id").isInt().exists().notEmpty().withMessage("Not a valid id!!(must be numeric and not empty)")
  static email: any = body('email').isEmail().optional().withMessage("Not a valid email!!(must be valid email format)");
  static firstName: any = body('firstName').isString().optional().withMessage("Not a valid firstName!!(must be string)");
  static lastName: any = body('lastName').isString().optional().withMessage("Not a valid lastName!!(must be string)");
  static phrase: any = body('phrase').isString().optional().withMessage("Not a valid phrase!!(must be string)");
  static mobile: any = body('basicInfo.mobile').isString().withMessage("Not a valid mobile!!(must be valid string)");
  // static phone: any = body('basicInfo.phone').isArray().withMessage("Not a valid phone!!(must be valid array)");
  static managerNameBasicInfo: any = body('basicInfo.managerName').isString().withMessage("Not a valid managerName!!(must be string and not empty)");
  static countryAbr: any = body('basicInfo.countryAbr').isString().withMessage("Not a valid countryAbr!!(must be string and not empty)");
  static operatorId: any = body('operatorId').notEmpty().isInt().withMessage("Not a valid operatorId!!(must be numeric)");
  static profileId: any = body('profileId').isInt().withMessage("Not a valid profileId!!(must be numeric)");
  static grade: any = body('grade').isInt({ gt: 0 }).withMessage("Not a valid grade!!(must be numeric and  greater than 0)");
  static gradeId: any = body('gradeId').isInt({ gt: 0 }).withMessage("Not a valid gradeId!!(must be numeric and  greater than 0)");
  static roleId: any = body('roleId').notEmpty().isInt().withMessage("Not a valid roleId!!(must be numeric)");
  static subject: any = body('subject').isString().withMessage("Not a valid subject!!(must be string)");
  static message: any = body('message').isString().withMessage("Not a valid message!!(must be string)");
  static status: any = body('status').isInt().withMessage("Not a valid status!!(must be numeric)");
  static businessTypeId: any = body('businessTypeId').isInt().withMessage("Not a valid businessTypeId!!(must be numeric)");
  static role: any = body('role').isInt().withMessage("Not a valid role!!(must be numeric)");
  static day: any = body('day').isString().withMessage("Not a valid day!!(must be string)");
  static month: any = body('month').isString().withMessage("Not a valid month!!(must be string)");
  static year: any = body('year').isString().withMessage("Not a valid year!!(must be string)");
  static gender: any = body('gender').isInt().optional().withMessage("Not a valid gender!!(must be numeric)");
  static nationalCode: any = body('nationalCode').isString().optional().withMessage("Not a valid nationalCode!!(must be string)");
  static country: any = body('country').isString().optional().withMessage("Not a valid country!!(must be string)");
  static managerName: any = body('managerName').isString().optional().withMessage("Not a valid managerName!!(must be string)");
  static city: any = body('city').isString().optional().withMessage("Not a valid city!!(must be string)");
  static logo: any = body('logo').isString().optional().withMessage("Not a valid logo!!(must be string)");
  static economicCode: any = body('economicCode').isString().optional().withMessage("Not a valid economicCode!!(must be string)");
  static avatar: any = body('avatar').isString().notEmpty().withMessage("Not a valid avatar!!(must be string)");
  static departmentId: any = body('departmentId').isInt().notEmpty().withMessage("Not a valid departmentId!!(must be string )");
  static workingHours: any = body('workingHours').isString().optional().withMessage("Not a valid workingHours!!(must be string )");
  static isAccept: any = body('isAccept').isBoolean().withMessage("Not a valid isAccept!!(must be boolean )");
  static profileIds: any = body('profileIds').custom(value => {
    if (value.some(x => Number.isInteger(x))) return true;
    return false;
  }).withMessage("Invalid data!! profileIds must be array of integer");
  static displayName: any = [
    check('displayName.en').isString(),
    check('displayName.fa').isString(),
  ]
  static addresses: any = [
    check('addresses.Address').isString().optional().withMessage("Not a valid Address!!(must be string )")
  ]
  static phone: any = body('basicInfo.phone').custom(value => {
    if (value.length === 0 || value.every(x => typeof x === "string")) return true;
    return false;
  }).optional().withMessage("Not a valid phone!!(must be array of string)");
  static basicInfo: any = [
    profileValidate.mobile,
    profileValidate.countryAbr,
    profileValidate.day,
    profileValidate.month,
    profileValidate.year,
    profileValidate.gender,
    profileValidate.nationalCode,
  ]

  static basicInfoForupdateMe: any = [
    profileValidate.phone,
    profileValidate.country,
    profileValidate.city,
    profileValidate.nationalCode,
    profileValidate.gender
    // profileValidate.economicCode,
    // profileValidate.workingHours,
    // profileValidate.managerNameBasicInfo
  ]

  static basicInfoForAddBusiness: any = [
    profileValidate.phone,
    profileValidate.managerName,
    profileValidate.country,
    profileValidate.city,
    profileValidate.logo,
    profileValidate.nationalCode,
    profileValidate.economicCode,
    profileValidate.workingHours,
  ]

  static basicInfoForUpdateLogo: any = [
    body('basicinfo.logo').isString().optional().withMessage("Not a valid logo!!(must be string )")
  ]
}