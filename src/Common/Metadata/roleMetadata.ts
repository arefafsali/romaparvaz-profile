import { body, } from "express-validator";
export class role {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
  public permissions: number[] = null;
}

export class flatRole {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
  public permissions: number[] = null;
}

export class roleValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static idForDeleteAndUpdate: any = body('id').exists().isInt().withMessage("Not a valid id!!(must be numeric and not empty)");
}