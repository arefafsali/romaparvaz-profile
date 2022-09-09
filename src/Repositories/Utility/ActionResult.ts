import { HTTPStatusCode } from "./HttpStatusCode";
import { Response } from "express";
export function RejectHandler(
    reject: Function,
    error: any = {},
    errMessage: string = "Internal server error",
    statusCode: number = HTTPStatusCode.InternalServerError
): void {
    reject({
        error,
        statusCode,
        errMessage,
    });
}

export function ResponseHandler(
    res: Response,
    resultData: any,
    err,
    pageSize: number = 0,
    pageNumber: number = 0
): void {
    let totalRecords = 0,
        itemsPerPage = pageSize,
        PageIndex = pageNumber,
        errMessage = err && err.errMessage ? err.errMessage : null,
        error = err && err.error ? err.error : null,
        data = resultData,
        code = err && err.statusCode ? err.statusCode : 200;

    if (data) {
        if (data.flatItems && data.flatItems.length > 0) data = this.FlatEntity(data.result, data.flatItems);
        if (data.count) totalRecords = data.count;
        else if (data.length && data[0].totalCount > 0)
            totalRecords = data[0].totalCount;
        totalRecords = parseInt(totalRecords.toString())
    }

    if (Array.isArray(err) && err.length > 0) {
        errMessage = err[0] && err[0].msg ? err[0].msg : "invalid type";
        code = HTTPStatusCode.UnprocessableEntity;
        error = err;
    }

    res.status(code).send({
        status: code,
        error: error,
        errMessage: errMessage,
        payload: {
            data: data ? data : null,
            totalRecords,
            itemsPerPage,
            PageIndex,
        },
    });
}

export function FlatEntity() {
    let [head, ...tail] = arguments;
    tail = [].concat.apply([], tail);
    [head.rows ? head.rows : head][0].forEach((item: any) =>
        tail.forEach((flatItem) => delete item["dataValues"].password)
    );
    return head;
}
