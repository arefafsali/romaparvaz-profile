import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { permission } from "../../Common/Metadata/permissionMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"

export class PermissionsManager extends BaseRepository<permission> {
  constructor() {
    super("permissions");
  }
  /** @description all of the ids as a list
   * @param {User} id_list  body is a list of integers like :[1,2,3,4,5]
   */
  getByList(id_list: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByList",
      apiType: "GET"
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
        .catch(err => RejectHandler(reject, err));
    });
  }
}
Object.seal(PermissionsManager);
