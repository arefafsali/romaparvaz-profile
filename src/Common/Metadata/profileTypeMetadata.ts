import { body, checkSchema } from "express-validator";
export class profileType {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
  public isShow: boolean = null;
}
export class profileTypeValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static idForDeleteAndUpdate: any = body('id').exists().isInt().withMessage("Not a valid id!!(must be numeric and not empty)");
}
