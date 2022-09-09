import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { pointType } from "../../Common/Metadata/pointTypeMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { SortAndFilterFieldHelper } from '../../Repositories/Utility/SortAndFilterFieldNameHelper';

export class PointTypesManager extends BaseRepository<pointType> {
  constructor() {
    super("pointTypes");
  }
  /**
   * 
   * @param {Number} code to find in database by it
   */
  getByCode(code) {
    this.referrerOption = {
      user: null,
      apiName: "getByCode",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { code } }).then((result) => {
        resolve(result)
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  /**
  * 
  * @param {String} phrase A stirng to start searching with that 
  * @param {int} page_number number of whole count of the pages
  * @param {int} items_per_page Number of items inserted in each page
  */
  getByPaging(page_number: number, items_per_page: number, filter: any = {}, sort: any = {}) {
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(key => sort[key] = sort[key] === "asc" ? orderArr.push([key, "ASC"]) : orderArr.push([key, "DESC"]))

      let query = {};

      if (filter.code)
        query = {
          ...query,
          code: filter.code
        }
      this.findAndCountAll({
        where: query,

        offset: parseInt(page_number.toString()) * parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]]

      }).then((result) => {
        resolve(result)
      }).catch(err => {
        console.log(err)
        RejectHandler(reject, err)
      });
    })
  }
}
Object.seal(PointTypesManager);
