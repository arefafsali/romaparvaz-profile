import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { role } from "../../Common/Metadata/roleMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
export class RolesManager extends BaseRepository<role> {
  constructor() {
    super("roles");
  }
  /**
     * @param {Array} id_list with body like :[1,2,3,4,5,...] **/
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
  /**
   * 
   * @param page_number 
   * @param items_per_page 
   *@param sort object for sort
   *@param filter object for filter
   */
  getByPaging(page_number: number, items_per_page: number,
    filter: any = {}, sort: any = {}) {
    // adding  filter
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(key => sort[key] = sort[key] === "asc" ? orderArr.push([key, "ASC"]) : orderArr.push([key, "DESC"]))

      let query: any = {}
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            {
              "code": filter.phrase
            },
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('name'), 'fa')), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.fn('JSONB_EXTRACT_PATH_TEXT', Sequelize.col('name'), 'en')), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("description")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
          ]
        };
      this.findAndCountAll({
        where: query,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]]

      })
        .then(result => {
          resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }
}
Object.seal(RolesManager);
