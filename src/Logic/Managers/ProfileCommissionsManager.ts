import { ProfileTypesManager } from './ProfileTypesManager';
var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { profileCommission, flatProfileCommission } from "../../Common/Metadata/profileCommissionMetadata";
import { flatCommissionRule } from "./../../Common/Metadata/commissionRuleMetadata";
import { ProfilesManager } from "./ProfilesManager";
import { PointTypesManager } from "./PointTypesManager";
import { CommissionRulesManager } from "./CommissionRulesManager";
import DataAccess = require("../../Repositories/Base/DataAccess");
import {
  ExternalRequest,
  RequestTemplate
} from "../../Infrastructure/ExternalRequests";
import { resolve } from "url";
import { GatewayCommissionsManager } from './GatewayCommissionsManager';
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode"
import { flatGatewayCommission } from '../../Common/Metadata/gatewayCommissionMetadata';
export class ProfileCommissionsManager extends BaseRepository<profileCommission> {
  constructor() {
    super("profileCommissions");
  }

  /**
   * 
   * @param {Number} profileId 
   */
  findOrInsertCommission(body: any) {
    this.referrerOption = {
      user: null,
      apiName: "findOrInsertCommission",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      // let oCommissionRule = new CommissionRulesManager()
      // let query = {},
      //   { isPercent, gatewayId, includeAirlines, excludeAirlines, commissionTypeId, profileTypeId, isNet } = body
      // query = {
      //   gatewayId,
      //   commissionTypeId,
      //   profileTypeId,
      //   includeAirlines: { [Op.eq]: includeAirlines },
      //   excludeAirlines: { [Op.eq]: excludeAirlines },
      // }
      // oCommissionRule.getByMarkup(query).then((result: any) => {
      //   if (result && result.length) {
      //     resolve(result[0])
      //   }
      //   else {
      //     oCommissionRule.create(body).then(result => {
      //       resolve(result)
      //     }).catch(error => {
      //       reject(error)
      //     })
      //   }
      // }).catch(error => {
      //   reject(error)
      // })
    })
  }

  findProfileTypesByCode(profileCode) {
    this.referrerOption = {
      user: null,
      apiName: "findOrInsertCommission",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let oProfileTypes = new ProfileTypesManager()
      oProfileTypes.findByCode(profileCode).then(result => {
        if (result)
          resolve(result)
        else resolve([])
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  insertByCommissionOrMarkup(body: any, isMainProfile: boolean = false) {
    this.referrerOption = {
      user: null,
      apiName: "findOrInsertCommission",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      if (body.id == 0) {
        if (isMainProfile)
          body.profileCode = '8';
        let airlineCallback = () => {
          this.findProfileTypesByCode(body.profileCode).then((profileId: any) => {
            if (profileId && profileId.length) {
              body.profileTypeId = profileId[0].id
              this.findOrInsertCommission(body).then((result: any) => {
                if (result) {
                  let profileBody = {
                    commissionRuleId: result.id,
                    commission: body.commission,
                    isPercent: body.isPercent,
                    currencyId: body.currencyId,
                    markup: body.markup,
                    profileId: body.profileId
                  }
                  this.insertByProfileIdAndCommission(profileBody)
                    .then(result => resolve(result))
                    .catch(err =>
                      RejectHandler(reject, err));
                }
                else resolve({})
              }).catch(err =>
                RejectHandler(reject, err));
            }
            else resolve({})
          }).catch(profileId_error =>
            RejectHandler(reject, profileId_error));

        }
        if (body.includeAirlines.length == 0 && body.excludeAirlines.length == 0)
          ExternalRequest.syncGetRequest(process.env.MAIN_URL + "airline").then((airlines: any) => {
            body.includeAirlines = airlines.payload.data.map(airline => airline.code);
            airlineCallback();
          }).catch(airline_error =>
            RejectHandler(reject, airline_error));
        else
          airlineCallback();
      }
      else {
        let oCommissionRule = new CommissionRulesManager()
        this.find({ where: { id: body.id } }).then((result: any) => {
          let profileBody = { ...body }
          body.id = result[0].commissionRuleId
          // oCommissionRule.updateByCommission(body).then(result => {
          //   this.update(profileBody).then(result => { resolve(result) })
          //     .catch(error => { reject(error) })
          // }).catch(error => reject(error))
        }).catch(err =>
          RejectHandler(reject, err));
      }
    })
  }

  insertByProfileIdAndCommission(body: any) {
    this.referrerOption = {
      user: null,
      apiName: "insertByProfileIdAndCommission",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.create(body).then(result => resolve(result)).catch(err =>
        RejectHandler(reject, err));
    })
  }

  getByCommissionCodeAndProfileId(profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "insertByProfileIdAndCommission",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      // let oCommissionRule_Mgm = new CommissionRulesManager();
      // oCommissionRule_Mgm.getByCode().then((com_rul_result: any) => {
      //   if (com_rul_result && com_rul_result.length > 0) {
      //     let ids = [...new Set(com_rul_result.map(item => item.id))];
      //     this.find(
      //       {
      //         where: {
      //           profileId,
      //           commissionRuleId: { [Op.in]: ids }
      //         }
      //       }).then((result) => {
      //         resolve(result)
      //       }).catch((err) => {
      //         reject(err)
      //       });
      //   }
      // }).catch((err) => {
      //   reject(err)
      // });
    })
  }

  /**
   * 
   * @param {Number} profileId 
   * @param page_number 
   * @param items_per_page 
   */
  getByProfileId(profileId: number, page_number: number, items_per_page: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.findAndCountAll(
        {
          where: {
            profileId
          },
          include: [
            {
              model: DataAccess.Models["commissionRules"],
              include: [
                {
                  model: DataAccess.Models["profileTypes"]
                }
              ]
            }
          ],
          offset:
            parseInt(page_number.toString()) *
            parseInt(items_per_page.toString()),
          limit: parseInt(items_per_page.toString())
        }).then((result) => {
          this.getAllDependencies(null, result).then((result) => {
            resolve(result)
          }).catch(err =>
            RejectHandler(reject, err));
        }).catch(err =>
          RejectHandler(reject, err));
    })
  }

  /**
   * 
   * @param {Number} profileId 
   */
  getCommissionByProfileId(profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getCommissionByProfileId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let profilesMgm = new ProfilesManager();
      let CommissionRuleMgm = new CommissionRulesManager()
      profilesMgm.findOne(profileId).then((profile_result: any) => {
        let profile = profile_result[0]["dataValues"];
        this.findAndCountAll(
          {
            where: {
              profileId
            }
          }).then((result) => {
            this.getAllDependencies(null, result).then((result: any) => {
              let finalResult: flatCommissionRule[] = [];
              result.rows.map(el => {
                el.includeAirlines.map(al => {
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
              ExternalRequest.syncPostRequest(process.env.MAIN_URL + "airline/codes_list", finalResult.map(el => el.airlineCode))
                .then((airline_result: any) => {
                  finalResult.forEach(el => {
                    el.airline = airline_result.payload.data.find(al => al.code == el.airlineCode);
                  });
                  CommissionRuleMgm.getByProfile(profile.profileTypeId, profile.profileGradeId, true)
                    .then((commission_result: any) => {
                      commission_result.forEach(element => {
                        if (!finalResult.some(cmr => cmr.gatewayId == element.gatewayId && cmr.airlineCode == element.airlineCode))
                          finalResult.push(element);
                      })
                      resolve(finalResult);
                    }).catch(err =>
                      RejectHandler(reject, err));
                }).catch(err =>
                  RejectHandler(reject, err));
            })
              .catch(err => RejectHandler(reject, err))
          }).catch(err =>
            RejectHandler(reject, err));
      })
    })
  }

  /** @description An array of objects for this parameter
  * @param {Array} id_list  body is a list of objects like :[ {} , {} , ...]
  */
  bulkUpdate(items: any) {
    this.referrerOption = {
      user: null,
      apiName: "bulkUpdate",
      apiType: "PUT"
    }
    return new Promise((resolve, reject) => {
      // TODO: Bulk update must develop
      items.forEach(element => {
        this.update(element).then((result) => {
          resolve(result)
        }).catch(err =>
          RejectHandler(reject, err));
      });
      resolve(true);
    })
  }

  /** @description all of the ids as a list
  * @param {Array} id_list  body is a list of integers like :[1,2,3,4,5]
  */
  bulkCreate(id_list: any, profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "bulkCreate",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      // let ocommissionRulesMgm = new CommissionRulesManager();
      // ocommissionRulesMgm.find(
      //   {
      //     where: {
      //       id: id_list
      //     }
      //   }).then((result: any) => {
      //     if (result) {
      //       result.forEach(element => {
      //         let oprofileCommission = new profileCommission();
      //         let ocommissionRule = element["dataValues"];
      //         oprofileCommission.profileId = profileId;
      //         oprofileCommission.commission = ocommissionRule.commission;
      //         oprofileCommission.currencyId = ocommissionRule.currencyId;
      //         oprofileCommission.isPercent = ocommissionRule.isPercent;
      //         oprofileCommission.commissionRuleId = ocommissionRule.id;
      //         this.create(oprofileCommission).then((result) => {
      //           resolve(result
      //           )
      //         }).catch((err) => {
      //           reject(err)
      //         }); // TODO: Bulk insert must develop
      //       });
      //       resolve(true);
      //     }
      //   }).catch((err) => {
      //     reject(err)
      //   });
    })
  }

  /**
   * 
   * @param {Number} profileId 
   * @param {Number} profileTypeId 
   * @param {Number} gradeId 
   */
  insertAllCommissionRules(
    profileId: number,
    profileTypeId: number,
    gradeId: number,
  ) {
    this.referrerOption = {
      user: null,
      apiName: "insertAllCommissionRules",
      apiType: "POST"
    }
    console.log("insertAllCommissionRules", profileId, profileTypeId, gradeId);
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.query(
        `CALL ssp_insert_all_commission_rules(${profileTypeId},${gradeId},${profileId})`,
        {
          type: Sequelize.QueryTypes.INSERT
        }
      ).then(profileCommission => {
        resolve(profileCommission)
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  /**
   * 
   * @param {Number} profileId 
   */
  getUnassignedRules(profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getUnassignedRules",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let oProfileMgm = new ProfilesManager();
      let oPointTypeMgm = new PointTypesManager();
      oProfileMgm.findOne(profileId.toString()).then((profile_result) => {
        if (profile_result) {
          DataAccess.ModelInstance.query(
            `SELECT * FROM fn_get_all_unassigned_rules(${profile_result[0].profileTypeId
            },${profile_result[0].profileGradeId},${profileId})`,
            {
              type: Sequelize.QueryTypes.SELECT
            }
          ).then(profileCommission => {
            let err = "Something went wrong";
            if (profileCommission) {
              oPointTypeMgm.find(
                {
                  where: {
                    id: profileCommission.map(prc => prc.commissionTypeId)
                  }
                }).then((com_type_result: any) => {
                  profileCommission.map(res => {
                    res.commissionType = com_type_result.some(
                      cor => cor.id == res.commissionTypeId
                    )
                      ? com_type_result.filter(
                        cor => cor.id == res.commissionTypeId
                      )[0]["dataValues"]
                      : null;
                  });
                  let request_templates = [];
                  let _gatewayIds = profileCommission
                    .filter(res => res.gatewayId)
                    .map(res => res.gatewayId);

                  let _currecyIds = profileCommission
                    .filter(res => res.currencyId)
                    .map(res => res.currencyId);
                  _currecyIds = [
                    ...profileCommission
                      .filter(res => res.currencyId)
                      .map(res => res.currencyId)
                  ];
                  let _airlineTypeIds = profileCommission
                    .filter(res => res.airlineTypeId)
                    .map(res => res.airlineTypeId);

                  request_templates.push(
                    new RequestTemplate(
                      process.env.MAIN_URL + "gateway/list",
                      _gatewayIds,
                      "POST"
                    )
                  );
                  request_templates.push(
                    new RequestTemplate(
                      process.env.MAIN_URL + "money_unit/list",
                      _currecyIds,
                      "POST"
                    )
                  );
                  request_templates.push(
                    new RequestTemplate(
                      process.env.MAIN_URL + "general_item/list",
                      _airlineTypeIds,
                      "POST"
                    )
                  );
                  ExternalRequest.callMultipleRequest(
                    request_templates).then((req_result: any) => {
                      profileCommission.map(res => {
                        (res.gateway =
                          req_result.payload.data[0] &&
                            req_result.payload.data[0].some(
                              gateway => gateway._id == res.gatewayId
                            )
                            ? req_result.payload.data[0].filter(
                              gateway => gateway._id == res.gatewayId
                            )[0]
                            : null),
                          (res.airlineType =
                            req_result.payload.data[2] &&
                              req_result.payload.data[2].some(
                                air => air._id == res.airlineTypeId
                              )
                              ? req_result.payload.data[2].filter(
                                air => air._id == res.airlineTypeId
                              )[0]
                              : null),
                          (res.currency =
                            req_result.payload.data[1] &&
                              req_result.payload.data[1].some(curr => curr._id == res.currencyId)
                              ? req_result.payload.data[1].filter(
                                curr => curr._id == res.currencyId
                              )[0]
                              : null);
                      });
                      resolve(profileCommission);
                    }).catch(err =>
                      RejectHandler(reject, err));
                }).catch(err =>
                  RejectHandler(reject, err));
            } else RejectHandler(reject, err);
            // reject(err);
          });
        }
      }).catch(profile_err =>
        RejectHandler(reject, profile_err));
    })
  }

  /**
   * 
   * @param {Number} profileId 
   * @param page_number 
   * @param items_per_page 
   */
  getByAirline(
    profileId: number,
    page_number: number,
    items_per_page: number,
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getByAirline",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.findAndCountAll(
        {
          where: {
            profileId
          },
          offset:
            parseInt(page_number.toString()) *
            parseInt(items_per_page.toString()),
          limit: parseInt(items_per_page.toString()),
          include: [
            {
              model: DataAccess.Models["commissionRules"],
              include: [
                {
                  model: DataAccess.Models["commissionTypes"],
                  where: { code: 3 }, // TODO: must get from a good source
                }
              ]
            },
          ],
          order: [["id", "ASC"]]
        }).then((result) => {
          this.getAllDependencies(null, result).then((result) => {
            resolve(result)
          }).catch(err =>
            RejectHandler(reject, err));
        }).catch(err =>
          RejectHandler(reject, err));
    })
  }

  /** @description all of the ids as a list
  * @param {Array} id_list  body is a list of integers like :[{
  * rows,}]
  */
  getAllDependencies(
    err: any,
    result: any,
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getAllDependencies",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      if (result && result.rows.length !== 0) {
        let request_templates = [];
        let _gatewayIds = result.rows
          .filter(res => res.gatewayId)
          .map(res => res.gatewayId);

        let _currecyIds = result.rows
          .filter(res => res.currencyId)
          .map(res => res.currencyId);
        _currecyIds = [
          ...new Set(
            result.rows.map(res => {
              if (res.commission) return res.commission.currencyId;
            })
          ),
          ...new Set(
            result.rows.map(res => {
              if (res.counterCommission) return res.counterCommission.currencyId;
            })
          ),
          ...new Set(
            result.rows.map(res => {
              if (res.ownerCommission) return res.ownerCommission.currencyId;
            })
          ),
          ...new Set(
            result.rows.map(res => {
              if (res.markup) return res.markup.currencyId;
            })
          )
        ];
        request_templates.push(
          new RequestTemplate(
            process.env.MAIN_URL + "gateway/list",
            _gatewayIds,
            "POST"
          )
        );
        request_templates.push(
          new RequestTemplate(
            process.env.MAIN_URL + "money_unit/list",
            _currecyIds,
            "POST"
          )
        );
        ExternalRequest.callMultipleRequest(
          request_templates).then((req_result: any) => {
            result = {
              count: result.count,
              rows: result.rows.map(res => ({
                ...res.dataValues,
                gateway:
                  req_result[0] &&
                    req_result[0].some(
                      gateway => gateway._id == res.gatewayId
                    )
                    ? req_result[0].filter(
                      gateway => gateway._id == res.gatewayId
                    )[0]
                    : null,
                markup: {
                  ...res.markup,
                  currency: res.markup
                    ? req_result[1].payload.data &&
                      req_result[1].payload.data.some(
                        curr => curr._id == res.markup.currencyId
                      )
                      ? req_result[1].payload.data.filter(
                        curr => curr._id == res.markup.currencyId
                      )[0]
                      : null
                    : undefined
                },
                commission: {
                  ...res.commission,
                  currency: res.commission
                    ? req_result[1].payload.data.some(
                      curr => curr._id == res.commission.currencyId
                    )
                      ? req_result[1].payload.data.filter(
                        curr => curr._id == res.commission.currencyId
                      )[0]
                      : null
                    : undefined
                },
                ownerCommission: {
                  ...res.ownerCommission,
                  currency: res.ownerCommission
                    ? req_result[1].payload.data.some(
                      curr => curr._id == res.ownerCommission.currencyId
                    )
                      ? req_result[1].payload.data.filter(
                        curr => curr._id == res.ownerCommission.currencyId
                      )[0]
                      : null
                    : undefined
                },
                counterCommission: {
                  ...res.counterCommission,
                  currency: res.counterCommission
                    ? req_result[1].payload.data.some(
                      curr => curr._id == res.counterCommission.currencyId
                    )
                      ? req_result[1].payload.data.filter(
                        curr => curr._id == res.counterCommission.currencyId
                      )[0]
                      : null
                    : undefined
                }
              }))
            };
            resolve(result)
          }).catch(err =>
            RejectHandler(reject, err));
      }
      else if (result.rows.length === 0)
        resolve({ rows: [] });
      else
        RejectHandler(reject, err);
    })
  }

  /** @description calculate markup, commission and points */
  calculateMarkupAndCommissionAndPoint(body: any) {
    this.referrerOption = {
      user: null,
      apiName: "calculateMarkupAndCommissionAndPoint",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      let oProfileMgm = new ProfilesManager();
      let oPointTypeMgm = new PointTypesManager();
      DataAccess.ModelInstance.query(
        `SELECT * FROM "fn_Get_Markup_temp"(
          ${body.sellerProfileId},${body.buyerProfileId},'${body.gatewayId}',
          '{${body.airlineCodes.join()}}',${body.commissionTypeCode},'${body.currencyId}')
          AS ("end_user_markup" JSONB, "include_airlines" VARCHAR[], "end_user_point" FLOAT)`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      ).then(profileCommission => {
        resolve(profileCommission);
      }).catch(err =>
        RejectHandler(reject, err));
    })
  }

  create(item: profileCommission) {
    this.referrerOption = {
      user: null,
      apiName: "create",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      item.isActive = true;
      let _gatewayCommisionMGR = new GatewayCommissionsManager();
      let airlineCallback = (_gatewayCommissionResult) => {
        // TODO: check currency for this criteria
        if (item.includeAirlines.every(al => _gatewayCommissionResult.some(gc => gc.airlineCode == al)))
          // Assume commission is in percent for now
          if (true && this.validateProfileCommissionForInsert(item, _gatewayCommissionResult)) {
            let query = {
              includeAirlines: { [Op.overlap]: item.includeAirlines },
              serviceTypeId: item.serviceTypeId,
              gatewayId: item.gatewayId,
              isSeller: false,
              isActive: true
            };
            if (item.profileId)
              query['profileId'] = item.profileId;
            if (item.profileTypeId)
              query['profileTypeId'] = item.profileTypeId;
            if (item.profileGradeId)
              query['profileGradeId'] = item.profileGradeId;
            if (item.toCountryCode)
              query['toCountryCode'] = { [Op.overlap]: item.toCountryCode };
            if (item.fromCountryCode)
              query['fromCountryCode'] = { [Op.overlap]: item.fromCountryCode };
            if (item.toCityCode)
              query['toCityCode'] = { [Op.overlap]: item.toCityCode };
            if (item.fromCityCode)
              query['fromCityCode'] = { [Op.overlap]: item.fromCityCode };
            if (item.startDate)
              query['startDate'] = item.startDate + "T00:00:00Z";
            if (item.endDate)
              query['endDate'] = item.endDate + "T00:00:00Z";
            this.find({
              where: query
            })
              .then((duplicate_result) => {
                if (duplicate_result && duplicate_result.length > 0) {
                  duplicate_result.forEach(element => {
                    element.includeAirlines = element.includeAirlines.filter(al => item.includeAirlines.indexOf(al) < 0)
                  });

                  this.updateBatch(JSON.parse(JSON.stringify(duplicate_result)))
                    .then(update_result => {
                      super.create(item)
                        .then(result => resolve(result))
                        .catch(err => RejectHandler(reject, err));
                    })
                    .catch(err => RejectHandler(reject, err));
                }
                else
                  super.create(item)
                    .then(result => resolve(result))
                    .catch(err => RejectHandler(reject, err));

              })
              .catch(err => RejectHandler(reject, err));
          }
          else
            RejectHandler(reject, {}, "Input object is not valid", HTTPStatusCode.Forbidden);
        else
          RejectHandler(reject, {}, "One of airlines does not have commission entry in gateway commission list", HTTPStatusCode.Forbidden);
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

  updateBatch(items: profileCommission[]) {
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
            if (items.some(el => this.validateProfileCommissionForInsert(el)))
              this.createBatch(items.filter(el => this.validateProfileCommissionForInsert(el)))
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
        .then((findResult: profileCommission) => {
          findResult = findResult[0];
          findResult.isActive = false;
          super.update(JSON.parse(JSON.stringify(findResult)))
            .then(updateResult => resolve(updateResult))
            .catch(err => RejectHandler(reject, err));
        })
    })
  }

  getByGatewayAirlines(gatewayId: string, airlines: string[], profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByGatewayAirlines",
      apiType: "POST"
    }
    return new Promise<flatProfileCommission[]>((resolve, reject) => {
      this.getByGatewayProfile(gatewayId, profileId, false)
        .then(airlineResult => {
          resolve(airlineResult.filter(el => airlines.indexOf(el.airlineCode) >= 0))
        })
        .catch(err => RejectHandler(reject, err));
    });
  }

  deleteAirline(airlineCode: string, gatewayId: string, profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "deleteAirline",
      apiType: "DELETE"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { includeAirlines: { [Op.overlap]: [airlineCode] }, gatewayId, profileId, isActive: true } })
        .then((findResult: profileCommission[]) => {
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

  getByGatewayProfile(gatewayId: string, profileId: number, includeAllData: boolean) {
    this.referrerOption = {
      user: null,
      apiName: "getByGatewayProfile",
      apiType: "GET"
    }
    return new Promise<flatProfileCommission[]>((resolve, reject) => {
      let profileMGM = new ProfilesManager();
      let commissionRuleMGM = new CommissionRulesManager();
      let gatewayCommissionMGM = new GatewayCommissionsManager();
      profileMGM.findOne(profileId)
        .then(profileResult => {
          let profileGradeId = profileResult[0].profileGradeId;
          let profileTypeId = profileResult[0].profileTypeId;
          this.find({ where: { gatewayId, profileId, isActive: true, isSeller: false } })
            .then(profileCommissionResult => {
              commissionRuleMGM.getByGatewayProfile(gatewayId, profileTypeId, profileGradeId, false)
                .then(commissionRuleResult => {
                  gatewayCommissionMGM.getByGateway(gatewayId, includeAllData)
                    .then(gatewayCommissionResult => {
                      let tempResult: flatProfileCommission[] = [];
                      let finalResult: flatProfileCommission[] = [];
                      profileCommissionResult.forEach(el => {
                        el.includeAirlines.forEach(al => {
                          tempResult.push({
                            airline: undefined,
                            airlineCode: al,
                            buyerProfileId: el.buyerProfileId,
                            commission: el.commission,
                            commissionRule: undefined,
                            counterCommission: el.counterCommission,
                            ownerCommission: el.ownerCommission,
                            gatewayCommission: undefined,
                            gatewayId: el.gatewayId,
                            isSeller: el.isSeller,
                            markup: el.markup,
                            profileGradeId: el.profileGradeId,
                            profileId: el.profileId,
                            profileTypeId: el.profileTypeId,
                            serviceTypeId: el.serviceTypeId,
                            startDate: undefined,
                            endDate: undefined,
                            fromCountry: undefined,
                            fromCountryCode: undefined,
                            toCountry: undefined,
                            toCountryCode: undefined,
                            fromCity: undefined,
                            fromCityCode: undefined,
                            toCity: undefined,
                            toCityCode: undefined
                          })
                        })
                      })
                      ExternalRequest.syncPostRequest(process.env.MAIN_URL + "money_unit/list",
                        Array.from(new Set([
                          ...tempResult.filter(el => el.commission && el.commission.currencyId).map(el => el.commission.currencyId),
                          ...tempResult.filter(el => el.counterCommission && el.counterCommission.currencyId).map(el => el.counterCommission.currencyId),
                          ...tempResult.filter(el => el.markup && el.markup.currencyId).map(el => el.markup.currencyId)
                        ])))
                        .then((currency_resutl: any) => {
                          tempResult.forEach(el => {
                            if (el.commission && el.commission.currencyId)
                              el.commission.currency = currency_resutl.payload.data.find(currency => currency._id == el.commission.currencyId)
                            if (el.counterCommission && el.counterCommission.currencyId)
                              el.counterCommission.currency = currency_resutl.payload.data.find(currency => currency._id == el.counterCommission.currencyId)
                            if (el.markup && el.markup.currencyId)
                              el.markup.currency = currency_resutl.payload.data.find(currency => currency._id == el.markup.currencyId)
                          })
                          gatewayCommissionResult.forEach(el => {
                            let crObj = commissionRuleResult.find(crel => crel.airlineCode == el.airlineCode);
                            let pcObj = tempResult.find(pcel => pcel.airlineCode == el.airlineCode);
                            finalResult.push({
                              airline: el.airline,
                              airlineCode: el.airlineCode,
                              buyerProfileId: pcObj ? pcObj.buyerProfileId : null,
                              commission: pcObj ? pcObj.commission : null,
                              counterCommission: pcObj ? pcObj.counterCommission : null,
                              ownerCommission: pcObj ? pcObj.ownerCommission : null,
                              gatewayId: el.gatewayId,
                              isSeller: pcObj ? pcObj.isSeller : null,
                              markup: pcObj ? pcObj.markup : null,
                              profileGradeId: pcObj ? pcObj.profileGradeId : null,
                              profileId: pcObj ? pcObj.profileId : null,
                              profileTypeId: pcObj ? pcObj.profileTypeId : null,
                              serviceTypeId: pcObj ? pcObj.serviceTypeId : null,
                              commissionRule: {
                                commission: crObj ? crObj.commission : null,
                                counterCommission: crObj ? crObj.counterCommission : null,
                                markup: crObj ? crObj.markup : null
                              },
                              gatewayCommission: {
                                domesticCommission: el.domesticCommission,
                                internationalCommission: el.internationalCommission
                              },
                              startDate: undefined,
                              endDate: undefined,
                              fromCountry: undefined,
                              fromCountryCode: undefined,
                              toCountry: undefined,
                              toCountryCode: undefined,
                              fromCity: undefined,
                              fromCityCode: undefined,
                              toCity: undefined,
                              toCityCode: undefined
                            })
                          })
                          resolve(finalResult);
                        })
                        .catch(err => RejectHandler(reject, err));
                    })
                    .catch(err => RejectHandler(reject, err));
                })
                .catch(err => RejectHandler(reject, err));
            })
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    })
  }

  getByGatewayId(gatewayId: string, profileTypeId: number, profileGradeId: number, page_number: number, items_per_page: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByGatewayId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let query: any = {
        profileId: null,
        isActive: true,
        isSeller: false,
        profileTypeId: null,
        profileGradeId: null,
        gatewayId
      };
      if (profileTypeId)
        query = { ...query, profileTypeId };
      if (profileGradeId)
        query = { ...query, profileGradeId };

      this.findAndCountAll({ where: query, offset: page_number * items_per_page, limit: items_per_page })
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result));
          ExternalRequest.syncPostRequest(process.env.MAIN_URL + "location/codes_list",
            Array.from(new Set([
              ...result.rows.filter(el => el.fromCityCode).map(el => el.fromCityCode).reduce((current, element) => current.concat(element), []),
              ...result.rows.filter(el => el.toCityCode).map(el => el.toCityCode).reduce((current, element) => current.concat(element), [])
            ]))
          )
            .then((locationResult: any) => {
              ExternalRequest.syncPostRequest(process.env.MAIN_URL + "country/list",
                Array.from(new Set([
                  ...result.rows.filter(el => el.fromCountryCode).map(el => el.fromCountryCode).reduce((current, element) => current.concat(element), []),
                  ...result.rows.filter(el => el.toCountryCode).map(el => el.toCountryCode).reduce((current, element) => current.concat(element), [])
                ]))
              )
                .then((countryResult: any) => {
                  ExternalRequest.syncPostRequest(process.env.MAIN_URL + "money_unit/list",
                    Array.from(new Set([
                      ...result.rows.filter(el => el.commission && el.commission.currencyId).map(el => el.commission.currencyId),
                      ...result.rows.filter(el => el.counterCommission && el.counterCommission.currencyId).map(el => el.counterCommission.currencyId),
                      ...result.rows.filter(el => el.markup && el.markup.currencyId).map(el => el.markup.currencyId)
                    ]))
                  )
                    .then((currencyResult: any) => {
                      ExternalRequest.syncPostRequest(process.env.MAIN_URL + "airline/codes_list", Array.from(new Set(result.rows.reduce((p, v) => [...p, ...v.includeAirlines], []))))
                        .then((airline_result: any) => {
                          result.rows.forEach(element => {
                            element.fromCity = element.fromCityCode ? locationResult.payload.data.filter(el => element.fromCityCode.indexOf(el.code) >= 0) : [];
                            element.toCity = element.toCityCode ? locationResult.payload.data.filter(el => element.toCityCode.indexOf(el.code) >= 0) : [];
                            element.fromCountry = element.fromCountryCode ? countryResult.payload.data.filter(el => element.fromCountryCode.indexOf(el.code) >= 0) : [];
                            element.toCountry = element.toCountryCode ? countryResult.payload.data.filter(el => element.toCountryCode.indexOf(el.code) >= 0) : [];
                            element.airlines = [];
                            element.includeAirlines.forEach((al, ind) => {
                              element.airlines[ind] = airline_result.payload.data.find(alr => alr.code == al)
                            })
                            if (element.commission && element.commission.currencyId)
                              element.commission.currency = currencyResult.payload.data.find(currency => currency._id == element.commission.currencyId)
                            if (element.counterCommission && element.counterCommission.currencyId)
                              element.counterCommission.currency = currencyResult.payload.data.find(currency => currency._id == element.counterCommission.currencyId)
                            if (element.markup && element.markup.currencyId)
                              element.markup.currency = currencyResult.payload.data.find(currency => currency._id == element.markup.currencyId)
                          });
                          resolve(result);
                        })
                        .catch(err => RejectHandler(reject, err))
                    })
                    .catch(err => RejectHandler(reject, err));
                })
                .catch(err => RejectHandler(reject, err));

            })
            .catch(err => RejectHandler(reject, err));
        }).catch(err => RejectHandler(reject, err))
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

  private validateProfileCommissionForInsert(item: profileCommission, gatewayCommissions?: flatGatewayCommission[]): boolean {
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
Object.seal(ProfileCommissionsManager);
