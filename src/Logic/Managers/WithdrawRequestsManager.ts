var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { withdrawRequest } from "../../Common/Metadata/withdrawRequestMetadata";
import { ProfilePointsManager } from "./ProfilePointsManager"
import DataAccess = require("../../Repositories/Base/DataAccess");
export class WithdrawRequestsManager extends BaseRepository<withdrawRequest> {
  constructor() {
    super("withdrawRequests");
  }

  create(item: withdrawRequest) {
    this.referrerOption = {
      user: null,
      apiName: "create",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      item.requestDate = new Date();

      super.create(item).then(res => {
        resolve(res)
      }).catch(err => {
        console.log(err)
        reject(err)
      })
    });
  }

  createMe(item: withdrawRequest, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "createMe",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      item.profileId = loggedInUser.profileId;
      item.withdrawTypeId = item.withdrawTypeId ? item.withdrawTypeId : 1; // default is for income 
      this.find({
        where: {
          profileId: loggedInUser.profileId,
          isApproved: null,
          withdrawTypeId: item.withdrawTypeId
        }
      }).then(result => {
        if (result.length == 0)
          this.create(item).then(res => resolve(res)).catch(err => reject(err))
        else
          resolve("OpenRequestIsExist");
      })
    });
  }

  updateIsPay(id: number, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "updateIsPay",
      apiType: "PUT"
    }
    return new Promise((resolve, reject) => {
      this.findOne(id).then(result => {
        let withdraw = result[0]["dataValues"];
        withdraw.isPay = true;
        this.update(withdraw).then(result_withdraw => {
          (new ProfilePointsManager).withdraw(withdraw.requestAmount, withdraw.profileId)
            .then(result_ProfilePoint => {
              resolve(result_withdraw);
            })
            .catch(err => reject(err));
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  getMe(loggedInUser: any, withdrawTypeId: number, page_number: number, items_per_page: number) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getMe",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let query: any = {
        profileId: loggedInUser.profileId
      }
      if (withdrawTypeId) {
        if (withdrawTypeId == 1)
          query = {
            ...query,
            withdrawTypeId: withdrawTypeId,
          }
        if (withdrawTypeId == 2)
          query = {
            ...query,
            withdrawTypeId: withdrawTypeId,
          }
      };
      console.log(query)
      this.findAndCountAll({
        where: query,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profileBankAccounts"]
          }
        ]
      })
        .then(result => resolve(result))
        .catch(err => reject(err));
    });
  }

  getNewRequests(loggedInUser: any, page_number: number, items_per_page: number,
    filter: any = {}, sort: any = {}) {
    // adding  filter
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getNewRequests",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(key => sort[key] = sort[key] === "asc" ? orderArr.push([key, "ASC"]) : orderArr.push([key, "DESC"]))
      let query: any = {
        isApproved: null
      }
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.firstName")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.lastName")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.email")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            // TODO:Maryam ask Navid or sasan : search rooye mobile kar nemikone :
            // Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.basicInfo.mobile")), {
            //   [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            // }),
          ]
        };
      if (filter.startDate || filter.endDate) {
        let partQuery: any = {}
        if (filter.startDate)
          partQuery = { ...partQuery, [Op.gte]: filter.startDate + "T00:00:00Z" };
        if (filter.endDate)
          partQuery = { ...partQuery, [Op.lte]: filter.endDate + "T23:59:59Z" };
        query = {
          ...query, requestDate: partQuery
        }
      }
      this.findAndCountAll({
        where: query,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profiles"]
          },
          {
            model: DataAccess.Models["profileBankAccounts"]
          }
        ],
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]]

      })
        .then(result => resolve(result))
        .catch(err => reject(err));
    });
  }

  updateApprovedStatus(loggedInUser: any, item: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "updateApprovedStatus",
      apiType: "PUT"
    }
    return new Promise((resolve, reject) => {
      this.findOne(item.id).then((result: withdrawRequest) => {
        result = result[0]["dataValues"];
        result.isApproved = item.isApproved;
        result.description = item.description;
        this.update(result).then(res => resolve(res)).catch(err => reject(err));
      }).catch(err => reject(err))
    })
  }

  getApprovedRequest(page_number: number, items_per_page: number,
    filter: any = {}, sort: any = {}) {
    // adding  filter
    this.referrerOption = {
      user: null,
      apiName: "getApprovedRequest",
      apiType: "post"
    }
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(key => sort[key] = sort[key] === "asc" ? orderArr.push([key, "ASC"]) : orderArr.push([key, "DESC"]))

      let query: any = {
        isApproved: true
      }
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.firstName")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.lastName")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.email")), {
              [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            }),
            // TODO:Maryam ask sasan : search rooye mobile kar nemikone :
            // Sequelize.where(Sequelize.fn("lower", Sequelize.col("profile.basicInfo.mobile")), {
            //   [Op.like]: "%" + filter.phrase.toLowerCase() + "%"
            // }),
          ]
        };
      if (filter.startDate || filter.endDate) {
        let partQuery: any = {}
        if (filter.startDate)
          partQuery = { ...partQuery, [Op.gte]: filter.startDate + "T00:00:00Z" };
        if (filter.endDate)
          partQuery = { ...partQuery, [Op.lte]: filter.endDate + "T23:59:59Z" };
        query = {
          ...query, requestDate: partQuery
        }
      }

      this.findAndCountAll({
        where: query,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profileBankAccounts"]
          },
          {
            model: DataAccess.Models["profiles"]
          }
        ],
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]]
      })
        .then(result => {
          resolve(result)
        })
        .catch(err => {
          console.log(err)
          reject(err)
        });
    });
  }

  calculatePending(profileId: number, withdrawType: number) {
    this.referrerOption = {
      user: profileId,
      apiName: "calculatePending",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.query(
        'SELECT * FROM "fn_WithdrawRequest_CalculatePending"(' +
        profileId +
        "," +
        withdrawType +
        ")",
        {
          type: Sequelize.QueryTypes.SELECT
        }
      ).then(pending => {
        let pendingAmount = pending[0].fn_WithdrawRequest_CalculatePending != null ? pending[0].fn_WithdrawRequest_CalculatePending : 0.0;
        resolve({ pendingAmount });
      }).catch(err => {
        reject(err)
      }
      )
    })
  }
}
Object.seal(WithdrawRequestsManager);
