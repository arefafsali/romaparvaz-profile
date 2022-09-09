var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { profileDepartment } from "../../Common/Metadata/profileDepartmentMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";
export class ProfileDepartmentsManager extends BaseRepository<
  profileDepartment
  > {
  constructor() {
    super("profileDepartments");
  }
  /**
   * 
   * @param {Number} profileId 
   * @param page_number 
   * @param items_per_page 
   */
  getByProfileId(
    profileId: number,
    page_number: number,
    items_per_page: number
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.findAndCountAll({
        where: {
          profileId
        },
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString())
      })
        .then(result => {
          resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }
}
Object.seal(ProfileDepartmentsManager);
