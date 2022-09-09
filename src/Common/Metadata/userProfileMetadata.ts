import { body } from "express-validator";
export class userProfile {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public userId: number = 0;
  public departmentId: number = 0;
  public roles: number[] = null;
  public isActive: boolean = true;
}
export class flatUserProfile {
  constructor() { }
  public id: number = 0;
  public profileId: number = 0;
  public userId: number = 0;
  public departmentId: number = 0;
  public roles: number[] = null;
}


export class userProfileValidate {
  constructor() { }
  static userId: any = body('userId').isInt().withMessage("Not a valid userId!!(must be numeric)");
  static profileId: any = body('profileId').isInt().withMessage("Not a valid profileId!!(must be numeric)");

  static roleIds: any = body('roleIds').custom(value => {
    if (value.every(x => Number.isInteger(x))) return true;
    return false;
  }).withMessage("Not a valid roleIds!!(must be array of integer)");

  static roles: any = body('roles').custom(value => {
    if (value.every(x => Number.isInteger(x))) return true;
    return false;
  }).withMessage("Not a valid roles!!(must be array of integer)");

}