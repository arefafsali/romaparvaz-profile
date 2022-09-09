var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { gatewayCommission, flatGatewayCommission } from "./../../Common/Metadata/gatewayCommissionMetadata";
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { ExternalRequest, RequestTemplate } from "../../Infrastructure/ExternalRequests";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";
export class GatewayCommissionsManager extends BaseRepository<gatewayCommission> {
  constructor() {
    super("gatewayCommissions");
  }

  create(item: gatewayCommission) {
    this.referrerOption = {
      user: null,
      apiName: "create",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      item.isActive = true;
      let airlineCallback = () => {
        if (!this.validateGatewayCommissionForInsert(item)) {
          RejectHandler(reject, {}, "Input object is not valid", HTTPStatusCode.Forbidden);
          // reject("Input object is not valid");

        }
        else {
          this.find({
            where: {
              includeAirlines: {
                [Op.overlap]: item.includeAirlines
              },
              serviceTypeId: item.serviceTypeId,
              gatewayId: item.gatewayId,
              isActive: true
            }
          })
            .then((duplicate_result: gatewayCommission[]) => {
              if (duplicate_result && duplicate_result.length > 0) {
                duplicate_result.forEach(element => {
                  element.includeAirlines = element.includeAirlines.filter(al => item.includeAirlines.indexOf(al) < 0)
                });

                this.updateBatch(JSON.parse(JSON.stringify(duplicate_result)))
                  .then(update_result => {
                    // this.deleteBatch(finalDuplicateResult.filter(el => el.includeAirlines.length == 0).map(el => el.id))
                    //     .then(delete_result => {
                    super.create(item)
                      .then(result => resolve(result))
                      .catch(error => RejectHandler(reject, error));
                  })
                  .catch(error => RejectHandler(reject, error));
              }
              else
                super.create(item)
                  .then(result => resolve(result))
                  .catch(error =>
                    RejectHandler(reject, error));

            })
            .catch(error =>
              RejectHandler(reject, error));
        }
      }
      if (item.includeAirlines.length == 0)
        ExternalRequest.syncGetRequest(process.env.MAIN_URL + "airline").then((airlines: any) => {
          item.includeAirlines = airlines.payload.data.map(airline => airline.code);
          airlineCallback();
        }).catch(airline_error =>
          RejectHandler(reject, airline_error));
      else
        airlineCallback();
    })
  }

  updateBatch(items: gatewayCommission[]) {
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
            if (items.some(el => this.validateGatewayCommissionForInsert(el)))
              this.createBatch(items.filter(el => this.validateGatewayCommissionForInsert(el)))
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

  update(item: gatewayCommission) {
    this.referrerOption = {
      user: null,
      apiName: "update",
      apiType: "PUT"
    }
    return new Promise((resolve, reject) => {
      this.findOne(item.id)
        .then((old_result: gatewayCommission) => {
          old_result.isActive = false;
          super.update(JSON.parse(JSON.stringify(old_result)))
            .then(update_result => {
              item.id = 0;
              item.isActive = true;
              this.create(item)
                .then(insert_result => {
                  resolve(insert_result)
                })
                .catch(err => RejectHandler(reject, err));
            })
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
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
        .then((findResult: gatewayCommission) => {
          findResult = findResult[0];
          findResult.isActive = false;
          super.update(JSON.parse(JSON.stringify(findResult)))
            .then(updateResult => resolve(updateResult))
            .catch(err => RejectHandler(reject, err));
        })
    })
  }

  getByGateway(gatewayId: string, includeAllData: boolean) {
    this.referrerOption = {
      user: null,
      apiName: "getByGateway",
      apiType: "GET"
    }
    return new Promise<flatGatewayCommission[]>((resolve, reject) => {
      this.find({ where: { gatewayId, isActive: true } })
        .then(result => {
          let finalResult: flatGatewayCommission[] = [];
          result.forEach(el => {
            el.includeAirlines.forEach(al => {
              finalResult.push({
                airlineCode: al,
                domesticCommission: el.domesticCommission,
                internationalCommission: el.internationalCommission,
                serviceTypeId: el.serviceTypeId,
                flightCountries: el.flightCountries,
                gatewayId: el.gatewayId,
                airline: undefined
              });
            });
          });
          ExternalRequest.syncPostRequest(process.env.MAIN_URL + "money_unit/list",
            [...finalResult.filter(el => el.domesticCommission && el.domesticCommission.currencyId).map(el => el.domesticCommission.currencyId),
            ...finalResult.filter(el => el.internationalCommission && el.internationalCommission.currencyId).map(el => el.internationalCommission.currencyId)],
          )
            .then((currency_resutl: any) => {
              finalResult.forEach(el => {
                if (el.domesticCommission && el.domesticCommission.currencyId)
                  el.domesticCommission.currency = currency_resutl.payload.data.find(currency => currency._id == el.domesticCommission.currencyId)
                if (el.internationalCommission && el.internationalCommission.currencyId)
                  el.internationalCommission.currency = currency_resutl.payload.data.find(currency => currency._id == el.internationalCommission.currencyId)
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

  getByGatewayAirlines(gatewayId: string, airlines: string[]) {
    this.referrerOption = {
      user: null,
      apiName: "getByGatewayAirlines",
      apiType: "POST"
    }
    return new Promise<flatGatewayCommission[]>((resolve, reject) => {
      this.find({ where: { gatewayId, includeAirlines: { [Op.overlap]: airlines }, isActive: true } })
        .then(result => {
          let finalResult: flatGatewayCommission[] = [];
          result.forEach(el => {
            el.includeAirlines.forEach(al => {
              if (airlines.indexOf(al) >= 0)
                finalResult.push({
                  airlineCode: al,
                  airline: undefined,
                  domesticCommission: el.domesticCommission,
                  internationalCommission: el.internationalCommission,
                  serviceTypeId: el.serviceTypeId,
                  flightCountries: el.flightCountries,
                  gatewayId: el.gatewayId
                });
            });
          });
          resolve(finalResult);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  deleteAirline(airlineCode: string, gatewayId: string) {
    this.referrerOption = {
      user: null,
      apiName: "deleteAirline",
      apiType: "DELETE"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { includeAirlines: { [Op.overlap]: [airlineCode] }, gatewayId, isActive: true } })
        .then((findResult: gatewayCommission[]) => {
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

  getActiveGateways() {
    this.referrerOption = {
      user: null,
      apiName: "getActiveGateways",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { isActive: true } })
        .then(result => {
          ExternalRequest.syncPostRequest(process.env.MAIN_URL + "gateway/list", Array.from(new Set(result.map(el => el.gatewayId))), "POST")
            .then((gateway_result: any) => {
              resolve(gateway_result)
            })
            .catch(err => {
              RejectHandler(reject, err)
            });
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  getCommissionFreeAirlinesByGateway(gatewayId: string) {
    this.referrerOption = {
      user: null,
      apiName: "getByGateway",
      apiType: "GET"
    }
    return new Promise<any[]>((resolve, reject) => {
      this.find({ where: { gatewayId, isActive: true } })
        .then(result => {
          let finalResult: string[] = [];
          result.forEach(el => {
            el.includeAirlines.forEach(al => {
              finalResult.push(al);
            });
          });
          ExternalRequest.syncGetRequest(process.env.MAIN_URL + "airline")
            .then((airline_result: any) => {
              resolve(airline_result.payload.data.filter(al => finalResult.indexOf(al.code) < 0).map(el => { return { airline: el } }))
            })
            .catch(err => RejectHandler(reject, err))
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  getPermissibleGateways(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "getPermissibleGateways",
      apiType: "POST"
    }
    return new Promise<any[]>((resolve, reject) => {
      let originConditions = []
      item.origin.forEach((element, index) => {
        originConditions.push({
          flightCountries: {
            [Op.contains]: [{
              origin: element
            }]
          }
        })
      })
      this.find({
        where: { [Op.or]: originConditions }
      })
        .then(result => {
          let finalResult = [];
          result.forEach((element: any) => {
            item.origin.forEach((origin, index) => {
              let filteredElements = element.flightCountries.filter(fgc => fgc.origin === origin && fgc.destination.includes(item.destination[index]));
              if (filteredElements) finalResult.push(element.gatewayId);
            });
          });
          resolve([...new Set(finalResult)]);
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  private validateGatewayCommissionForInsert(item: gatewayCommission): boolean {
    let result: boolean = true;
    if (item.id != 0)
      return false;
    if (item.includeAirlines.length == 0)
      return false;
    if (!item.gatewayId)
      return false;
    if (!item.isActive)
      return false;
    return true;
  }
}
Object.seal(GatewayCommissionsManager);
