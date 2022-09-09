import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
export function insertLog(
    collection: string,
    actionType: string,
    prevData: any,
    data: any,
    sendData: any,
    status: string,
    { user, apiName, apiType },
    rdbms = "Postgres"): any {
    return new Promise((resolve, reject) => {
        ExternalRequest.syncPostRequest(
            process.env.MAIN_URL + "dblog/insert",
            { collection, actionType, prevData, data, sendData, user, apiName, apiType, status, rdbms }).then((res) => {
                resolve(res)
            }).catch((err) => {
                reject(err);
            })
    });
}