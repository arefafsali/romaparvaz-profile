import { body, check } from "express-validator";
export class businessType {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
  public profileTypeId: number = 0;
}

export class flatBusinessType {
  constructor() { }
  public id: number = 0;
  public name: object = null;
  public code: string = "";
  public description: string = "";
  public profileTypeId: number = 0;
}

export class businessTypeValidate {
  constructor() { }
  static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
  static idForDelete: any = body('id').isInt().exists().notEmpty().withMessage("Not a valid id!!(must be numeric)");
  static description: any = body('description').isString().optional().withMessage("Not a valid description!!(must be string)");
  static code: any = body('code').isString().withMessage("Not a valid code!!(must be string)");
  static profileTypeId: any = body('profileTypeId').isInt().withMessage("Not a valid profileTypeId!!(must be numeric)");
  static businessTypeName: any = [check('name.en').isString().withMessage("Not a valid en!!(must be string)"),
  check('name.fa').isString().withMessage("Not a valid fa!!(must be string)")
  ];
}