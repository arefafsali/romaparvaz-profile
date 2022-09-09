import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { serviceType } from "../../Common/Metadata/serviceTypeMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
export class ServiceTypesManager extends BaseRepository<serviceType> {
  constructor() {
    super("serviceTypes");
  }
  /**
     * @param {Array} id_list with body like :[1,2,3,4,5,...]        **/
  getByList(id_list: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByList",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          id: id_list
        }
      })
        .then(result => {
          resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  getByCode(code: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByCode",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          code: code
        }
      })
        .then(result => {
          resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }
}
Object.seal(ServiceTypesManager);
