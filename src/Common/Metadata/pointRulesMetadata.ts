import { body } from "express-validator";
export class pointRules {
    constructor() { }
    public id: number = 0;
    public pointTypeId: number = 0;
    public point: number = 0;
    public isActive: boolean = false;
    public startRange: number = null;
    public endRange: number = null;
    public isPercent: boolean = false;
}
export class flatPointRules {
    constructor() { }
    public id: number = 0;
    public pointTypeId: number = 0;
    public point: number = 0;
    public isActive: boolean = false;
}

export class pointRulesValidate {
    constructor() { }
    static id: any = body('id').isInt().withMessage("Not a valid id!!(must be numeric)");
    static idforDelete: any = body('id').isInt().exists().notEmpty().withMessage("Not a valid id!!(must be numeric)");
    static pointTypeId: any = body('pointTypeId').isInt().withMessage("Not a valid pointTypeId!!(must be numeric)");
    static point: any = body('point').isString().withMessage("Not a valid point!!(must be string)");
    static isActive: any = body('isActive').isBoolean().withMessage("Not a valid isActive!!(must be boolean)");
}
