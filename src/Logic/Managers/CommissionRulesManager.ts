var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { commissionRule, flatCommissionRule } from "./../../Common/Metadata/commissionRuleMetadata";
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { ExternalRequest, RequestTemplate } from "../../Infrastructure/ExternalRequests";
import { GatewayCommissionsManager } from './GatewayCommissionsManager';
import { flatGatewayCommission } from "../../Common/Metadata/gatewayCommissionMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode"
export class CommissionRulesManager extends BaseRepository<commissionRule> {
  constructor() {
    super("commissionRules");
  }

  create(item: commissionRule) {
    this.referrerOption = {
      user: null,
      apiName: "create",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      console.log("profileGradeIds", item["profileGradeIds"])
      console.log("profileTypeIds", item["profileTypeIds"])
      item.isActive = true;
      let _gatewayCommisionMGR = new GatewayCommissionsManager();
      let airlineCallback = (_gatewayCommissionResult) => {
        let profileGradeIds = item["profileGradeIds"];
        let profileTypeIds = item["profileTypeIds"];
        delete item["profileGradeIds"];
        delete item["profileTypeIds"];
        console.log("Item", item);
        profileTypeIds.forEach((element_typeId, index_typeId) => {
          profileGradeIds.forEach((element, index) => {
            let newItem = JSON.parse(JSON.stringify(item));
            newItem.profileGradeId = parseInt(element);
            newItem.profileTypeId = parseInt(element_typeId);
            //console.log({ "SASAS_G": newItem.profileGradeId, "SASAS_T": newItem.profileTypeId, })
            // TODO: check currency for this criteria
            if (newItem.includeAirlines.every(al => _gatewayCommissionResult.some(gc => gc.airlineCode == al)))
              // Assume commission is in percent for now
              if (true && this.validateCommissionRuleForInsert(newItem, _gatewayCommissionResult)) {
                this.find({
                  where: {
                    profileTypeId: newItem.profileTypeId,
                    profileGradeId: newItem.profileGradeId,
                    includeAirlines: { [Op.overlap]: newItem.includeAirlines },
                    serviceTypeId: newItem.serviceTypeId,
                    gatewayId: newItem.gatewayId,
                    isActive: true
                  }
                })
                  .then((duplicate_result) => {
                    if (duplicate_result && duplicate_result.length > 0) {
                      duplicate_result.forEach(element_ => {
                        element_.includeAirlines = element_.includeAirlines.filter(al => newItem.includeAirlines.indexOf(al) < 0)
                      });

                      this.updateBatch(JSON.parse(JSON.stringify(duplicate_result)))
                        .then(update_result => {
                          super.create(newItem)
                            .then(result => {
                              //console.log("Sasan 1:", ((index + 1) === profileGradeIds.length && (index_typeId + 1) === profileTypeIds.length))
                              if ((index + 1) === profileGradeIds.length && (index_typeId + 1) === profileTypeIds.length)
                                resolve(result);
                            })
                            .catch(err => RejectHandler(reject, err));
                        })
                        .catch(err => RejectHandler(reject, err));
                    }
                    else
                      super.create(newItem)
                        .then(result => {
                          // console.log("Sasan 2:", ((index + 1) === profileGradeIds.length) && (index_typeId + 1) === profileTypeIds.length)
                          if ((index + 1) === profileGradeIds.length && (index_typeId + 1) === profileTypeIds.length)
                            resolve(result);
                        })
                        .catch(err => RejectHandler(reject, err));

                  })
                  .catch(err => RejectHandler(reject, err));
              }
              else RejectHandler(reject, {}, "Input object is not valid", HTTPStatusCode.Forbidden)
            // RejectHandler(reject, "Input object is not valid", HTTPStatusCode.Forbidden);
            else RejectHandler(reject, {}, "One of airlines does not have commission entry in gateway commission list", HTTPStatusCode.Forbidden);
          });
        });
      }

      if (item.includeAirlines.length == 0)
        _gatewayCommisionMGR.getByGateway(item.gatewayId, true)
          .then(_gatewayCommissionResult => {
            item.includeAirlines = _gatewayCommissionResult.map(el => el.airlineCode);
            airlineCallback(_gatewayCommissionResult);
          })
          .catch(err => RejectHandler(reject, err))
      else
        _gatewayCommisionMGR.getByGatewayAirlines(item.gatewayId, item.includeAirlines)
          .then(_gatewayCommissionResult => airlineCallback(_gatewayCommissionResult))
          .catch(err => RejectHandler(reject, err))
    });
  }

  updateBatch(items: commissionRule[]) {
    this.referrerOption = {
      user: null,
      apiName: "updateBatch",
      apiType: "PUT"
    }
    let query = { where: { id: { [Op.in]: items.map(x => x.id) } } };
    return new Promise((resolve, reject) => {
      this.find(query).then(result => {
        for (let index = 0; index < result.length; index++) {
          result[index].isActive = false;
        }
        super.updateBatch(JSON.parse(JSON.stringify(result)))
          .then(updateResult => {
            for (let index = 0; index < items.length; index++) {
              items[index].id = 0;
            }
            if (items.some(el => this.validateCommissionRuleForInsert(el)))
              this.createBatch(items.filter(el => this.validateCommissionRuleForInsert(el)))
                .then(createRes => {
                  resolve(createRes);
                }).catch(err => RejectHandler(reject, err))
            else
              resolve(updateResult);
          })
          .catch(err => RejectHandler(reject, err))
      })
    });
  }

  deleteBatch(_ids: number[]) {
    this.referrerOption = {
      user: null,
      apiName: "deleteBatch",
      apiType: "DELETE"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { id: { [Op.in]: _ids } } })
        .then(findResult => {
          findResult.forEach(element => {
            element.isActive = false;
          });
          this.updateBatch(JSON.parse(JSON.stringify(findResult)))
            .then(updateResult => resolve(updateResult))
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  delete(_id: number) {
    this.referrerOption = {
      user: null,
      apiName: "delete",
      apiType: "DELETE"
    }
    return new Promise((resolve, reject) => {
      this.findOne(_id)
        .then((findResult: commissionRule) => {
          findResult = findResult[0];
          findResult.isActive = false;
          super.update(JSON.parse(JSON.stringify(findResult)))
            .then(updateResult => resolve(updateResult))
            .catch(err => RejectHandler(reject, err));
        })
    })
  }

  getByGatewayAirlines(gatewayId: string, airlines: string[], profileTypeId: number, profileGradeId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByGatewayAirline",
      apiType: "POST"
    }
    return new Promise<flatCommissionRule[]>((resolve, reject) => {
      this.find({ where: { gatewayId, profileTypeId, profileGradeId, includeAirlines: { [Op.overlap]: airlines }, isActive: true } })
        .then(result => {
          let finalResult = [];
          result.forEach(el => {
            el.includeAirlines.forEach(al => {
              if (airlines.indexOf(al) >= 0)
                finalResult.push({
                  airline: al,
                  commission: el.commission,
                  serviceTypeId: el.serviceTypeId,
                  gatewayId: el.gatewayId,
                  profileGrades: el.profileGrades,
                  profileTypeId: el.profileTypeId,
                });
            });
          });
          resolve(finalResult);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  getByGateway(gatewayId: string, airlines: string[], page_number: number = 0, items_per_page: number = 10000, sort: any = {}) {
    this.referrerOption = {
      user: null,
      apiName: "getByGateway",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => { //<flatCommissionRule[]>
      console.log(gatewayId)
      let orderArr = [];
      Object.keys(sort).map(key => sort[key] = sort[key] === "asc" ? orderArr.push([key, "ASC"]) : orderArr.push([key, "DESC"]))

      let query: any = {
        gatewayId,
        includeAirlines: { [Op.overlap]: airlines },
        isActive: true
      }

      this.findAndCountAll({
        where: query,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        include: [
          {
            model: DataAccess.Models["profileTypes"],
            as: "profileTypes"
          },
          {
            model: DataAccess.Models["profileGrades"],
            as: "profileGrades"
          }
        ],
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]]
      })
        .then((result: any) => {
          let _airline = []
          let _gateway = []
          let _moneyUnit = []
          result.rows.map(item => {
            item.includeAirlines.map(air => { _airline.push(air) })
            _gateway.push(item.gatewayId)
            if (item.commission) _moneyUnit.push(item.commission.currencyId)
            if (item.ownerCommission) _moneyUnit.push(item.ownerCommission.currencyId)
            if (item.markup) _moneyUnit.push(item.markup.currencyId)
            if (item.counterCommission) _moneyUnit.push(item.counterCommission.currencyId)
          })
          let _airlinesTemplate = new RequestTemplate(`${process.env.MAIN_URL}airline/codes_list`, [... new Set(_airline)], 'POST');
          let _gatewayTemplate = new RequestTemplate(`${process.env.MAIN_URL}gateway/list/`, [... new Set(_gateway)], 'POST');
          let _moneyUnitTemplate = new RequestTemplate(`${process.env.MAIN_URL}money_unit/list/`, [... new Set(_moneyUnit)], 'POST');

          ExternalRequest.callMultipleRequest([_airlinesTemplate, _gatewayTemplate, _moneyUnitTemplate])
            .then((result_multi: any) => {
              let airlinelist = result_multi[0].payload.data
              let gateway = result_multi[1][0]
              let currency = result_multi[2].payload.data
              let finalResult = [];
              result.rows.forEach(el => {
                let airline = null;
                el.includeAirlines.forEach(al => {
                  if (airlines.indexOf(al) >= 0) {
                    if (el.commission) el.commission["currency"] = currency.find((curr: any) => (curr._id == el.commission.currencyId))
                    if (el.ownerCommission) el.ownerCommission["currency"] = currency.find((curr: any) => (curr._id == el.ownerCommission.currencyId))
                    if (el.markup) el.markup["currency"] = currency.find((curr: any) => (curr._id == el.markup.currencyId))
                    if (el.counterCommission) el.counterCommission["currency"] = currency.find((curr: any) => (curr._id == el.counterCommission.currencyId))
                    airline = {...airlinelist.find((airline: any) => (airline.code == al))}
                  }
                });
                finalResult.push({
                  id: el.id,
                  airline,
                  commission: el.commission,
                  serviceTypeId: el.serviceTypeId,
                  gatewayId: el.gatewayId,
                  gateway: gateway,
                  profileGradeId: el.profileGradeId,
                  profileGrades: el.profileGrades,
                  profileTypeId: el.profileTypeId,
                  profileTypes: el.profileTypes,
                  ownerCommission: el.ownerCommission,
                  markup: el.markup,
                  counterCommission: el.counterCommission,
                });
              });
              resolve({ count: result.count, rows: finalResult });
            })
            .catch(err => {
              RejectHandler(reject, err)
            });

        })
        .catch(err => {
          console.log(err)
          RejectHandler(reject, err)
        });
    });
  }

  deleteAirline(airlineCode: string, gatewayId: string, profileTypeId: number, profileGradeId: number) {
    this.referrerOption = {
      user: null,
      apiName: "deleteAirline",
      apiType: "DELETE"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { includeAirlines: { [Op.overlap]: [airlineCode] }, gatewayId, profileTypeId, profileGradeId, isActive: true } })
        .then((findResult: commissionRule[]) => {
          findResult.forEach(element => {
            element.includeAirlines = element.includeAirlines.filter(al => al != airlineCode);
          });
          this.updateBatch(JSON.parse(JSON.stringify(findResult)))
            .then(updateResult => resolve(updateResult))
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  getByGatewayProfile(gatewayId: string, profileTypeId: number, profileGradeId: number, includeAllData: boolean) {
    this.referrerOption = {
      user: null,
      apiName: "getByGatewayProfile",
      apiType: "GET"
    }
    return new Promise<flatCommissionRule[]>((resolve, reject) => {
      let query: any = { gatewayId, profileTypeId, isActive: true }
      if (profileGradeId)
        query = { ...query, profileGradeId }
      this.find({ where: query })
        .then(result => {
          let finalResult: flatCommissionRule[] = [];
          result.forEach(el => {
            el.includeAirlines.forEach(al => {
              finalResult.push({
                airlineCode: al,
                airline: undefined,
                commission: el.commission,
                counterCommission: el.counterCommission,
                ownerCommission: el.ownerCommission,
                profileGradeId: el.profileGradeId,
                profileTypeId: el.profileTypeId,
                serviceTypeId: el.serviceTypeId,
                gatewayId: el.gatewayId,
                markup: el.markup,
                profileGrades: {},
                profileTypes: {}
              });
            });
          });
          ExternalRequest.syncPostRequest(process.env.MAIN_URL + "money_unit/list",
            Array.from(new Set([
              ...finalResult.filter(el => el.commission && el.commission.currencyId).map(el => el.commission.currencyId),
              ...finalResult.filter(el => el.counterCommission && el.counterCommission.currencyId).map(el => el.counterCommission.currencyId),
              ...finalResult.filter(el => el.ownerCommission && el.ownerCommission.currencyId).map(el => el.ownerCommission.currencyId),
              ...finalResult.filter(el => el.markup && el.markup.currencyId).map(el => el.markup.currencyId)
            ]))
          )
            .then((currency_resutl: any) => {
              finalResult.forEach(el => {
                if (el.commission && el.commission.currencyId)
                  el.commission.currency = currency_resutl.payload.data.find(currency => currency._id == el.commission.currencyId)
                if (el.counterCommission && el.counterCommission.currencyId)
                  el.counterCommission.currency = currency_resutl.payload.data.find(currency => currency._id == el.counterCommission.currencyId)
                if (el.ownerCommission && el.ownerCommission.currencyId)
                  el.ownerCommission.currency = currency_resutl.payload.data.find(currency => currency._id == el.counterCommission.currencyId)
                if (el.markup && el.markup.currencyId)
                  el.markup.currency = currency_resutl.payload.data.find(currency => currency._id == el.markup.currencyId)
              })
              if (includeAllData) {
                ExternalRequest.syncPostRequest(process.env.MAIN_URL + "airline/codes_list", finalResult.map(el => el.airlineCode))
                  .then((airline_result: any) => {
                    finalResult.forEach(el => {
                      el.airline = airline_result.payload.data.find(al => al.code == el.airlineCode);
                    });
                    resolve(finalResult);
                  })
                  .catch(err => RejectHandler(reject, err))
              }
              else
                resolve(finalResult);
            })
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    })
  }
  getByProfile(profileTypeId: number, profileGradeId: number, includeAllData: boolean) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfile",
      apiType: "GET"
    }
    return new Promise<flatCommissionRule[]>((resolve, reject) => {
      this.find({ where: { profileTypeId, profileGradeId, isActive: true } })
        .then(result => {
          let finalResult: flatCommissionRule[] = [];
          result.forEach(el => {
            el.includeAirlines.forEach(al => {
              finalResult.push({
                airlineCode: al,
                airline: undefined,
                commission: el.commission,
                counterCommission: el.counterCommission,
                ownerCommission: el.ownerCommission,
                profileGradeId: el.profileGradeId,
                profileTypeId: el.profileTypeId,
                serviceTypeId: el.serviceTypeId,
                gatewayId: el.gatewayId,
                markup: el.markup,
                profileGrades: {},
                profileTypes: {}
              });
            });
          });
          ExternalRequest.syncPostRequest(process.env.MAIN_URL + "money_unit/list",
            Array.from(new Set([
              ...finalResult.filter(el => el.commission && el.commission.currencyId).map(el => el.commission.currencyId),
              ...finalResult.filter(el => el.counterCommission && el.counterCommission.currencyId).map(el => el.counterCommission.currencyId),
              ...finalResult.filter(el => el.markup && el.markup.currencyId).map(el => el.markup.currencyId)
            ]))
          )
            .then((currency_resutl: any) => {
              finalResult.forEach(el => {
                if (el.commission && el.commission.currencyId)
                  el.commission.currency = currency_resutl.payload.data.find(currency => currency._id == el.commission.currencyId)
                if (el.counterCommission && el.counterCommission.currencyId)
                  el.counterCommission.currency = currency_resutl.payload.data.find(currency => currency._id == el.counterCommission.currencyId)
                if (el.markup && el.markup.currencyId)
                  el.markup.currency = currency_resutl.payload.data.find(currency => currency._id == el.markup.currencyId)
              })
              if (includeAllData) {
                ExternalRequest.syncPostRequest(process.env.MAIN_URL + "airline/codes_list", finalResult.map(el => el.airlineCode))
                  .then((airline_result: any) => {
                    finalResult.forEach(el => {
                      el.airline = airline_result.payload.data.find(al => al.code == el.airlineCode);
                    });
                    resolve(finalResult);
                  })
                  .catch(err => RejectHandler(reject, err))
              }
              else
                resolve(finalResult);
            })
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    })
  }
  // update(item: commissionRule) {
  //   return new Promise((resolve, reject) => {
  //     let _gatewayCommisionMGR = new GatewayCommissionsManager();
  //     _gatewayCommisionMGR.getByGatewayAirline(item.gatewayId, item.includeAirlines)
  //       .then(_gatewayCommissionResult => {

  //         // TODO: check currency for this criteria
  //         if (item.includeAirlines.every(al =>
  //           _gatewayCommissionResult.some(gc => gc.airline == al)))
  //           // Assume commission is in percent for now
  //           if (item.includeAirlines.every(al =>
  //             _gatewayCommissionResult.find(gc => gc.airline == al)
  //               .commission.value >= ((item.commission ? item.commission.value : 0) + (item.counterCommission ? item.counterCommission.value : 0)))) {
  //             this.find({
  //               where: {
  //                 id: { [Op.ne]: item.id },
  //                 profileTypeId: item.profileTypeId,
  //                 profileGradeId: item.profileGradeId,
  //                 includeAirlines: { [Op.overlap]: item.includeAirlines },
  //                 serviceTypeId: item.serviceTypeId,
  //                 gatewayId: item.gatewayId
  //               }
  //             })
  //               .then((duplicate_result) => {
  //                 if (duplicate_result && duplicate_result.length > 0) {
  //                   duplicate_result.forEach(element => {
  //                     element.includeAirlines = element.includeAirlines.filter(al => item.includeAirlines.indexOf(al) < 0)
  //                   });
  //                   let finalDuplicateResult = JSON.parse(JSON.stringify(duplicate_result));

  //                   this.updateBatch(finalDuplicateResult.filter(el => el.includeAirlines.length != 0))
  //                     .then(update_result => {
  //                       this.deleteBatch(finalDuplicateResult.filter(el => el.includeAirlines.length == 0).map(el => el.id))
  //                         .then(delete_result => {
  //                           super.create(item)
  //                             .then(result => resolve(result))
  //                             .catch(err => RejectHandler(reject, err));
  //                         })
  //                         .catch(err => RejectHandler(reject, err));
  //                     })
  //                     .catch(err => RejectHandler(reject, err));
  //                 }
  //                 else
  //                   super.create(item)
  //                     .then(result => resolve(result))
  //                     .catch(err => RejectHandler(reject, err));

  //               })
  //               .catch(err => RejectHandler(reject, err));
  //           }
  //           else
  //             reject("Sum of commission and counter commission of one of airlines is greater than airline commission in gateway commission list");
  //         else
  //           reject("One of airlines does not have commission entry in gateway commission list");
  //       })
  //       .catch(err => RejectHandler(reject, err))
  //   });
  // }

  private validateCommissionRuleForInsert(item: commissionRule, gatewayCommissions?: flatGatewayCommission[]): boolean {
    let result: boolean = true;
    if (item.id != 0)
      return false;
    if (item.includeAirlines.length == 0)
      return false;
    if (!item.gatewayId)
      return false;
    if (!item.isActive)
      return false;
    // if (gatewayCommissions && item.includeAirlines.every(al =>
    //   gatewayCommissions.find(gc => gc.airlineCode == al)
    //     .commission.value >= ((item.commission ? item.commission.value : 0) + (item.counterCommission ? item.counterCommission.value : 0))))
    //   return false;
    // if (item.commission.value == 0 && item.markup && item.markup.maxValue <= 0)
    //   return false;
    return true;
  }
}
Object.seal(CommissionRulesManager);
