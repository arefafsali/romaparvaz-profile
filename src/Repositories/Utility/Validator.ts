import { validationResult } from "express-validator";
import { ResponseHandler } from "./ActionResult";

export function validate(req, res, next) {
    const error: any = validationResult(req)
    if (error.isEmpty()) {
        return next()
    }
    else
        ResponseHandler(res, null, error.errors)
}