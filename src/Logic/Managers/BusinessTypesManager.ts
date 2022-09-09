var Sequelize = require("sequelize");
var Op = Sequelize.Op; import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { businessType } from "../../Common/Metadata/businessTypeMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { SortAndFilterFieldHelper } from "../../Repositories/Utility/SortAndFilterFieldNameHelper";
export class BusinessTypesManager extends BaseRepository<businessType> {
  constructor() {
    super("businessTypes");
  }

  getAllWithDependency() {
    this.referrerOption = {
      user: null,
      apiName: "getAllWithDependency",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        include: [
          {
            model: DataAccess.Models["profileTypes"],
            as: "profileType"
          }
        ]
      })
        .then(result => resolve(result))
        .catch(err => RejectHandler(reject, err));
    });
  }

  getByCodeList(codeList: string[]) {
    this.referrerOption = {
      user: null,
      apiName: "getByCodeList",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          code: { [Op.in]: codeList }
        }
      })
        .then(result => resolve(result))
        .catch(error =>
          RejectHandler(reject, error));
    })
  }

  getByIdList(idList: string[]) {
    this.referrerOption = {
      user: null,
      apiName: "getByIdList",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          id: { [Op.in]: idList }
        }
      })
        .then(result => resolve(result))
        .catch(error =>
          RejectHandler(reject, error));
    })
  }

  getByPaging(page_number: number, items_per_page: number, filter: any = {}, sort: any = {}) {
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let query = {};
      if (filter.profileTypeId)
        query = {
          ...query,
          profileTypeId: filter.profileTypeId
        }
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('businessTypes.name'), 'fa')), { [Op.like]: "%" + filter.phrase + "%" }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('businessTypes.name'), 'en')), { [Op.like]: "%" + filter.phrase + "%" }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col('businessTypes.code')), { [Op.like]: "%" + filter.phrase + "%" })
          ]
        }
      // if (filter.code)
      //   query = {
      //     ...query,
      //     code: { [Op.like]: "%" + filter.code + "%" }
      //   }
      if (Object.keys(filter).some(key => key.indexOf("name.") >= 0)) {
        query = {
          ...query,
          [Op.or]: Object.keys(filter).filter(key => key.indexOf("name.") >= 0).map(key =>
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('businessTypes.name'), key.split('.')[1])), {
              [Op.like]: "%" + filter[key] + "%"
            }))
        }
      }
      Object.keys(sort).forEach(key => {
        if (key.indexOf("name.") == 0) {
          sort["businessTypes." + key] = sort[key];
          delete sort[key];
        }
      })
      this.findAndCountAll({
        where: query,
        include: [
          {
            model: DataAccess.Models["profileTypes"],
            as: "profileType"
          }
        ],
        order: Object.keys(sort).map(key => [key.split('.').length > 2 ? Sequelize.json(SortAndFilterFieldHelper.generateJSONFieldName(key)) : Sequelize.col(key), sort[key] === "desc" ? "DESC" : "ASC"]),
        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString())
      }).then((result) => {
        resolve(result)
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }
}
Object.seal(BusinessTypesManager);
