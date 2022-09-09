import { body, check } from "express-validator";
export class permission {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
}
export class flatPermission {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
}

export class permissionValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static idForDeleteAndUpdate: any = body('id').exists().isInt().notEmpty().withMessage("Not a valid id!!(must be numeric and not empty)");
  static code: any = body('code').isString().withMessage("Not a valid code!!(must be string and not empty)");
  static description: any = body('description').isString().withMessage("Not a valid description!!(must be string and not empty)");

}