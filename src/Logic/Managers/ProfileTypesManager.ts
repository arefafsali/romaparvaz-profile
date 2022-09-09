var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { profileType } from "../../Common/Metadata/profileTypeMetadata";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import { UserProfilesManager } from "./UserProfilesManager";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
export class ProfileTypesManager extends BaseRepository<profileType> {
  constructor() {
    super("profileTypes");
  }
  findByCode(profileCode) {
    this.referrerOption = {
      user: null,
      apiName: "findByCode",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { code: profileCode } })
        .then(result => { resolve(result) })
        .catch(err =>
          RejectHandler(reject, err));
    })
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

  getAllWithDependency() {
    this.referrerOption = {
      user: null,
      apiName: "getAllWithDependency",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          isShow: true
        },
        include: [
          {
            model: DataAccess.Models["businessTypes"]
          }
        ]
      })
        .then(result => {
          resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }
}
Object.seal(ProfileTypesManager);
