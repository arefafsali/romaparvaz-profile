var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { pointRules } from './../../Common/Metadata/pointRulesMetadata';
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import DataAccess = require('../../Repositories/Base/DataAccess');
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { SortAndFilterFieldHelper } from '../../Repositories/Utility/SortAndFilterFieldNameHelper';
import { query } from 'express-validator';
export class PointRulesManager extends BaseRepository<pointRules> {
    constructor() {
        super("pointRules");
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
            let query = {};
            if ("isActive" in filter && !(filter.isActive === ""))
                query = {
                    ...query,
                    isActive: filter.isActive
                }
            if (filter.pointTypeId)
                query = {
                    ...query,
                    pointTypeId: filter.pointTypeId
                }
            this.findAndCountAll({
                where: query,
                include: [
                    {
                        model: DataAccess.Models["pointTypes"]
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

    /**
  * 
  * @param {int} pointTypeId Point Type Id
  */
    getByType(
        pointTypeId: number
    ) {
        this.referrerOption = {
            user: null,
            apiName: "getByType",
            apiType: "GET"
        }
        return new Promise((resolve, reject) => {
            this.find({
                where: {
                    pointTypeId,
                    isActive: true
                },
                include: [
                    {
                        model: DataAccess.Models["pointTypes"]
                    }
                ]
            }).then((result) => {
                resolve(result)
            }).catch(err =>
                RejectHandler(reject, err));
        })
    }

    getTransactionWage(pointAmount: number) {
        this.referrerOption = {
            user: null,
            apiName: "transaction_wage",
            apiType: "POST"
        }
        return new Promise((resolve, reject) => {
            this.find({
                where: {
                    pointTypeId: 10, // code 7 for transfering point
                    isActive: true
                }
            })
                .then((transferRules_result: any) => {
                    let rule = transferRules_result.find(rule => pointAmount >= rule.startRange && pointAmount <= rule.endRange)
                    let percent = rule.isPercent ? 0.01 : 1
                    resolve({
                        wage: rule.point * pointAmount * percent,
                        PointRules: rule
                    })
                })
                .catch(err => RejectHandler(reject, err));
        })
    }
}
Object.seal(PointRulesManager);
