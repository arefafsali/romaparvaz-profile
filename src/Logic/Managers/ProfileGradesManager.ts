var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { profileGrade } from "../../Common/Metadata/profileGradeMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import DataAccess = require('../../Repositories/Base/DataAccess');
import { SortAndFilterFieldHelper } from '../../Repositories/Utility/SortAndFilterFieldNameHelper';
export class ProfileGradesManager extends BaseRepository<profileGrade> {
  constructor() {
    super("profileGrades");
  }


  getByPaging(page_number: number, items_per_page: number, filter: any = {}, sort: any = {}) {
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let query = {};
      if (filter.code)
        query = {
          ...query,
          code: filter.code
        };
      if (filter.phrase)
        query = {
          ...query,
          // TODO: search on name.en, name.fa
          [Op.or]: [
            {
              "code": filter.phrase
            },
          ]
        }
      // console.log({ query })
      this.findAndCountAll({
        where: query,
        order: Object.keys(sort).map(key => [key.split('.').length > 2 ? Sequelize.json(SortAndFilterFieldHelper.generateJSONFieldName(key)) : Sequelize.col(key), sort[key] === "desc" ? "DESC" : "ASC"]),
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString())
      }).then((result) => {
        resolve(result)
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  findByCode(profileCode) {
    this.referrerOption = {
      user: null,
      apiName: "findByCode",
      apiType: "GET"
    }
    console.log("profileCode", profileCode)
    return new Promise((resolve, reject) => {
      this.find({ where: { code: profileCode } })
        .then(result => { resolve(result) })
        .catch(err =>
          RejectHandler(reject, err));
    })
  }
}
Object.seal(ProfileGradesManager);
