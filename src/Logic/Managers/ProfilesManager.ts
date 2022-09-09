var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import {
  profile,
  creditAmount,
  walletAmount,
} from "../../Common/Metadata/profileMetadata";
import { userProfile } from "../../Common/Metadata/userProfileMetadata";
import { profileDepartment } from "../../Common/Metadata/profileDepartmentMetadata";
import {
  ExternalRequest,
  RequestTemplate,
} from "../../Infrastructure/ExternalRequests";
import { UserProfilesManager } from "./UserProfilesManager";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RolesManager } from "./RolesManager";
import { PermissionsManager } from "./PermissionsManager";
import { BusinessTypesManager } from "./BusinessTypesManager";
import { ProfilePointsManager } from "./ProfilePointsManager";
import { UsersManager } from "./UsersManager";
import { ProfileCommissionsManager } from "./ProfileCommissionsManager";
import { ProfileDepartmentsManager } from "./ProfileDepartmentsManager";
import {
  RejectHandler,
  ResponseHandler,
} from "../../Repositories/Utility/ActionResult";
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";
import * as jwt from "jsonwebtoken";
import { CreditsManager } from "./CreditsManager";
import { WalletsManager } from "./WalletsManager";

export class ProfilesManager extends BaseRepository<profile> {
  constructor() {
    super("profiles");
  }

  getBusinessTypeById = (id) => {
    this.referrerOption = {
      user: null,
      apiName: "getBusinessTypeById",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          id: id,
        },
      })
        .then((result: any) => {
          if (result && result.length) {
            let businessType = [result[0].businessTypeId];
            resolve(businessType);
          } else {
            resolve("nothing found");
          }
        })
        .catch((err) => RejectHandler(reject, err));
    });
  };

  search = (phrase) => {
    this.referrerOption = {
      user: null,
      apiName: "search",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          [Op.or]: [
            {
              "displayName.en": {
                [Op.like]: "%" + phrase + "%",
              },
            },
            {
              "displayName.fa": {
                [Op.like]: "%" + phrase + "%",
              },
            },
          ],
        },
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  };

  getAllBuesinessProfiles() {
    this.referrerOption = {
      user: null,
      apiName: "getAllBuesinessProfiles",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({ where: { businessTypeId: { [Op.not]: null } } })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   *
   * @param {String} _id
   */
  findOneWithIncludes(_id: string) {
    this.referrerOption = {
      user: null,
      apiName: "getAllBuesinessProfiles",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: { id: _id },
        include: [
          {
            model: DataAccess.Models["users"],
            as: "creator",
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
              },
            ],
          },
          {
            model: DataAccess.Models["profileGrades"],
          },
          {
            model: DataAccess.Models["businessTypes"],
          },
        ],
      })
        .then((result: profile[]) => {
          if (result.length > 0) {
            result[0] = result[0]["dataValues"];
            let requests: RequestTemplate[] = [];
            if (result[0].basicInfo["country"])
              requests.push(
                new RequestTemplate(
                  `${process.env.MAIN_URL}country/code/${result[0].basicInfo["country"]}`,
                  "COUNTRY",
                  "GET",
                  undefined
                )
              );
            if (result[0].basicInfo["city"])
              requests.push(
                new RequestTemplate(
                  `${process.env.MAIN_URL}location/code/${result[0].basicInfo["city"]}`,
                  "CITY",
                  "GET",
                  undefined
                )
              );
            if (requests.length > 0)
              ExternalRequest.callMultipleRequest(requests)
                .then((mul_result: any) => {
                  if (requests[0].body == "COUNTRY")
                    result[0]["country"] = mul_result[0].payload.data;
                  else result[0]["city"] = mul_result[0].payload.data;
                  if (requests[1])
                    result[0]["city"] = mul_result[1].payload.data;
                  resolve(result);
                })
                .catch((err) => RejectHandler(reject, err));
            else resolve(result);
          } else resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   *
   * @param {String} _id
   */
  findOneUsingFunction(_id: string) {
    this.referrerOption = {
      user: null,
      apiName: "findOneUsingFunction",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.query(
        'SELECT * FROM "fn_Users_BusinessProfile_GetRole"(' + _id + ")",
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      )
        .then((profiles) => {
          resolve(profiles);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /** @description Tries to log out and clear all tokens of current logged in user.
     * @param {User} loggedInUser logged in user with body : {
            id: user.guid,
            userId: user.id,
            profileId: user.individualProfileId,
            roles: user.roles,
            firstName: ser.individualProfile.firstName,
            lastName: user.individualProfile.lastName
          }
     */
  findOneBusiness(_id: string, loggedInUserId: any) {
    this.referrerOption = {
      user: null,
      apiName: "findOneBusiness",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      let oRoleMgm = new RolesManager();
      let oPermissionMgm = new PermissionsManager();
      let profileResult;
      let requests: RequestTemplate[] = [];
      DataAccess.ModelInstance.query(
        `SELECT * FROM "fn_Users_BusinessProfile_GetRole_grade"(${_id},${loggedInUserId.userId})`,
        { type: Sequelize.QueryTypes.SELECT }
      )
        .then((profiles) => {
          if (profiles.length > 0) {
            profileResult = JSON.parse(JSON.stringify(profiles));
            profileResult[0].creditAmountStatus = "expired";
            if (
              profileResult[0].creditAmount &&
              profileResult[0].creditAmount.total > 0
            )
              profileResult[0].creditAmountStatus = "active";
            return new CreditsManager().calculateNumberOfProfileCredits(
              parseInt(_id)
            );
          } else resolve([]);
        })
        .then((count) => {
          if (count == 0) profileResult[0].creditAmountStatus = "no_credit";
          profileResult[0].creditsCount = count;
          return oRoleMgm.getByList(profileResult[0].roles);
        })
        .then((role_result: any) => {
          profileResult[0].roles = role_result;
          let permissionArray = [];
          role_result.forEach((role) => {
            if (role.permissions) permissionArray.push(...role.permissions);
          });
          return oPermissionMgm.getByList([...new Set(permissionArray)]);
        })
        .then((permission_result: any) => {
          profileResult[0].permissions = permission_result.map(
            (per) => per.name.en
          );
          if (profileResult[0].basicInfo.country)
            requests.push(
              new RequestTemplate(
                `${process.env.MAIN_URL}country/code/${profileResult[0].basicInfo.country}`,
                "COUNTRY",
                "GET",
                undefined
              )
            );
          if (profileResult[0].basicInfo.city)
            requests.push(
              new RequestTemplate(
                `${process.env.MAIN_URL}location/code/${profileResult[0].basicInfo.city}`,
                "CITY",
                "GET",
                undefined
              )
            );
          if (requests.length > 0)
            return ExternalRequest.callMultipleRequest(requests);
          else resolve(profileResult);
        })
        .then((mul_result: any) => {
          if (requests[0].body == "COUNTRY")
            profileResult[0].country = mul_result[0].payload.data;
          else profileResult[0].city = mul_result[0].payload.data;
          if (requests[1]) profileResult[0].city = mul_result[1].payload.data;
          resolve(profileResult);
        })
        .catch((err) => {
          RejectHandler(reject, err);
        });
    });
  }

  /** @description Tries to log out and clear all tokens of current logged in user.
     * @param {User} loggedInUser logged in user with body : {
            id: user.guid,
            userId: user.id,
            profileId: user.individualProfileId,
            roles: user.roles,
            firstName: ser.individualProfile.firstName,
            lastName: user.individualProfile.lastName
          }
          *@param sort object for sort
          *@param filter object for filter
     */
  findAllWithIncludes(
    loggedInUser: any,
    filterByOperator: boolean,
    page_number: number,
    items_per_page: number,
    filter: any = {},
    sort: any = {}
  ) {
    // adding  filter
    this.referrerOption = {
      user: loggedInUser,
      apiName: "findAllWithIncludes",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(
        (key) =>
          (sort[key] =
            sort[key] === "asc"
              ? orderArr.push([key, "ASC"])
              : orderArr.push([key, "DESC"]))
      );
      let query = {},
        query_individualProfile: any = {};
      query = {
        profileTypeId: { [Op.notIn]: [23, 32] },
      };
      if (filterByOperator)
        query = { ...query, operatorUserId: loggedInUser.userId };
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "fa"
                )
              ),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "en"
                )
              ),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.firstName")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.lastName")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.email")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
          ],
        };
      if (filter.profileGradeId)
        query = {
          ...query,
          profileGradeId: filter.profileGradeId,
        };
      if (filter.businessTypeId)
        query = {
          ...query,
          businessTypeId: filter.businessTypeId,
        };
      let startDate,
        endDate = null;
      let date_query: any = {};
      startDate = filter.startDate ? new Date(filter.startDate) : null;
      endDate = filter.endDate ? new Date(filter.endDate) : null;
      if (startDate) {
        date_query = { [Op.gte]: startDate.toISOString() };
      }
      if (endDate) {
        var tomorrow = new Date(endDate);
        tomorrow.setDate(tomorrow.getDate() + 1).toString();
        date_query = { ...date_query, [Op.lt]: tomorrow.toISOString() };
      }
      if (startDate || endDate)
        query = {
          ...query,
          createdAt: date_query,
        };

      if (filter.mobile)
        query_individualProfile = {
          ...query_individualProfile,
          // TODO:MARYAM ask sasan   filter.phrase => mobile
          [Op.or]: [
            // Sequelize.where(Sequelize.fn("lower", Sequelize.col("creator.individualProfile.basicInfo.mobile")), {
            //   [Op.like]: "%" + filter.mobile.toLowerCase() + "%"
            // }),
            // { "individualProfile.basicInfo.mobile": filter.mobile, }
          ],
        };

      if (filter.mobile)
        query = {
          ...query,
          // TODO:MARYAM ask sasan   filter.phrase => mobile
          [Op.or]: [
            // Sequelize.where(Sequelize.fn("lower", Sequelize.col("creator.individualProfile.basicInfo.mobile")), {
            //   [Op.like]: "%" + filter.mobile.toLowerCase() + "%"
            // }),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("creator.individualProfile"),
                  "firstName"
                )
              ),
              {
                [Op.like]: "%" + filter.mobile.toLowerCase() + "%",
              }
            ),
            // { "creator.individualProfile.basicInfo.mobile": filter.mobile, }
          ],
        };

      this.findAndCountAll({
        include: [
          {
            model: DataAccess.Models["users"],
            as: "creator",
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
              },
            ],
            // where: query_individualProfile,
          },

          {
            model: DataAccess.Models["users"],
            as: "operator",
          },
          {
            model: DataAccess.Models["profileTypes"],
          },
          {
            model: DataAccess.Models["businessTypes"],
          },
          {
            model: DataAccess.Models["profileGrades"],
          },
        ],

        where: query,
        // where: query_individualProfile,

        offset: page_number * items_per_page,
        limit: items_per_page,
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]],
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   * @description 
   * @param {Object} item with body like :{
   * creatorUserId,role,profileTypeId,businessTypeId}
   * @param {User} loggedInUser logged in user with body : {
              id: user.guid,
              userId: user.id,
              profileId: user.individualProfileId,
              roles: user.roles,
              firstName: ser.individualProfile.firstName,
              lastName: user.individualProfile.lastName
            }
   */
  createWithUser(item: any, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "createWithUser",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      item.creatorUserId = loggedInUser.userId;
      // var _role = item.role;
      var _role = 60;
      delete item.role;
      let businessTypeMgm = new BusinessTypesManager();
      let user_profile_mgm = new UserProfilesManager();
      let departmentMgm = new ProfileDepartmentsManager();
      businessTypeMgm
        .findOne(item.businessTypeId)
        .then((btm_result) => {
          item.profileTypeId = btm_result[0].profileTypeId;
          if (item.businessTypeId == 2) item.profileTypeId = 58;
          super
            .create(item)
            .then((profile_result) => {
              var _profile = profile_result["dataValues"];
              user_profile_mgm
                .create({
                  id: 0,
                  profileId: _profile.id,
                  roles: [_role],
                  userId: item.creatorUserId,
                  departmentId: null,
                  isActive: true,
                })
                .then((result) => {
                  let _department = new profileDepartment();
                  _department.code = "01";
                  _department.name = "Management";
                  _department.profileId = _profile.id;
                  departmentMgm
                    .create(_department)
                    .then((department_result) => resolve(result))
                    .catch((err) => RejectHandler(reject, err));
                })
                .catch((err) => RejectHandler(reject, err));
            })
            .catch((err) => RejectHandler(reject, err));
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   * 
   * @param loggedInUser @param {User} loggedInUser logged in user with body : {
              id: user.guid,
              userId: user.id,
              profileId: user.individualProfileId,
              roles: user.roles,
              firstName: ser.individualProfile.firstName,
              lastName: user.individualProfile.lastName
            }
   */
  getMe(loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getMe",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: { id: loggedInUser.profileId },
        include: [
          {
            model: DataAccess.Models["profileGrades"],
          },
        ],
      })
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result));
          let resultCount = 0;
          let resolveResult = () => {
            if (++resultCount == result.length) resolve(result[0]);
          };
          if (result.length == 0) resolve(result);

          if (result[0].creditAmount != null) {
            result[0].creditAmount.creditAmountStatus = "expired";
            if (result[0].creditAmount && result[0].creditAmount.total > 0)
              result[0].creditAmount.creditAmountStatus = "active";
            new CreditsManager()
              .calculateNumberOfProfileCredits(result[0].id)
              .then((count) => {
                if (count == 0)
                  result[0].creditAmount.creditAmountStatus = "no_credit";
                result[0].creditAmount.creditsCount = count;
                resolveResult();
              })
              .catch((err) => {
                RejectHandler(reject, err);
              });
          }
          resolveResult();
        })
        .catch((err) => {
          RejectHandler(
            reject,
            err,
            "User not found!",
            HTTPStatusCode.Forbidden
          );
        });
      // this.findOne(loggedInUser.profileId)
      //   .then((result: any) => {
      //     result = JSON.parse(JSON.stringify(result));
      //     let resultCount = 0;
      //     let resolveResult = () => {
      //       if (++resultCount == result.length) resolve(result[0]);
      //     };
      //     if (result.length == 0) resolve(result);

      //     if (result[0].creditAmount != null) {
      //       result[0].creditAmount.creditAmountStatus = "expired";
      //       if (result[0].creditAmount && result[0].creditAmount.total > 0)
      //         result[0].creditAmount.creditAmountStatus = "active";
      //       new CreditsManager()
      //         .calculateNumberOfProfileCredits(result[0].id)
      //         .then((count) => {
      //           if (count == 0)
      //             result[0].creditAmount.creditAmountStatus = "no_credit";
      //           result[0].creditAmount.creditsCount = count;
      //           resolveResult();
      //         })
      //         .catch((err) => {
      //           RejectHandler(reject, err);
      //         });
      //     }
      //     resolveResult();
      //   })
      //   .catch((err) => {
      //     RejectHandler(
      //       reject,
      //       err,
      //       "User not found!",
      //       HTTPStatusCode.Forbidden
      //     );
      //   });
    });
  }

  /**
   * @description using the  body phrase to find new evaluation
   * *@param sort object for sort
   *@param filter object for filter
   */
  findNewEvaluations(
    page_number: number,
    items_per_page: number,
    filter: any = {},
    sort: any = {}
  ) {
    // adding  filter) {
    this.referrerOption = {
      user: null,
      apiName: "findNewEvaluations",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(
        (key) =>
          (sort[key] =
            sort[key] === "asc"
              ? orderArr.push([key, "ASC"])
              : orderArr.push([key, "DESC"]))
      );
      let query: any = {
          isApproved: null,
          operatorUserId: null,
          profileTypeId: { [Op.notIn]: [23, 32] },
        },
        query_individualProfile: any = {};
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "fa"
                )
              ),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "en"
                )
              ),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.firstName")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.lastName")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.email")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
          ],
        };
      if (filter.profileGradeId)
        query = {
          ...query,
          profileGradeId: filter.profileGradeId,
        };
      if (filter.businessTypeId)
        query = {
          ...query,
          businessTypeId: filter.businessTypeId,
        };
      let startDate,
        endDate = null;
      let date_query: any = {};
      startDate = filter.startDate ? new Date(filter.startDate) : null;
      endDate = filter.endDate ? new Date(filter.endDate) : null;
      if (startDate) {
        date_query = { [Op.gte]: startDate.toISOString() };
      }
      if (endDate) {
        var tomorrow = new Date(endDate);
        tomorrow.setDate(tomorrow.getDate() + 1).toString();
        date_query = { ...date_query, [Op.lt]: tomorrow.toISOString() };
      }
      if (startDate || endDate)
        query = {
          ...query,
          createdAt: date_query,
        };
      // TODO:MARYAM  filter.phrase => mobile
      this.findAndCountAll({
        where: query,
        include: [
          {
            model: DataAccess.Models["users"],
            as: "creator",
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
              },
            ],
          },
          {
            model: DataAccess.Models["profileTypes"],
          },
          {
            model: DataAccess.Models["businessTypes"],
          },
          {
            model: DataAccess.Models["profileGrades"],
          },
        ],
        offset: page_number * items_per_page,
        limit: items_per_page,
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]],
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   * 
     * @param loggedInUser @param {User} loggedInUser logged in user with body : {
                id: user.guid,
                userId: user.id,
                profileId: user.individualProfileId,
                roles: user.roles,
                firstName: ser.individualProfile.firstName,
                lastName: user.individualProfile.lastName
              }
   * @param sort object for sort
   * @param filter object for filter
   */
  findAssignToMe(
    loggedInUser: any,
    isApproved: boolean,
    page_number: number,
    items_per_page: number,
    filter: any = {},
    sort: any = {}
  ) {
    // adding  filter
    this.referrerOption = {
      user: loggedInUser,
      apiName: "findAssignToMe",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      let orderArr = [];
      Object.keys(sort).map(
        (key) =>
          (sort[key] =
            sort[key] === "asc"
              ? orderArr.push([key, "ASC"])
              : orderArr.push([key, "DESC"]))
      );
      let query: any = {
        operatorUserId: loggedInUser.userId, // 64,// TODO:MARYAM uncomment userId
        isApproved: isApproved,
        profileTypeId: { [Op.notIn]: [23, 32] },
      };
      if (filter.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "fa"
                )
              ),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "en"
                )
              ),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.firstName")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.lastName")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.email")),
              {
                [Op.like]: "%" + filter.phrase.toLowerCase() + "%",
              }
            ),
          ],
        };
      if (filter.profileGradeId)
        query = {
          ...query,
          profileGradeId: filter.profileGradeId,
        };
      if (filter.businessTypeId)
        query = {
          ...query,
          businessTypeId: filter.businessTypeId,
        };
      let startDate,
        endDate = null;
      let date_query: any = {};
      startDate = filter.startDate ? new Date(filter.startDate) : null;
      endDate = filter.endDate ? new Date(filter.endDate) : null;
      if (startDate) {
        date_query = { [Op.gte]: startDate.toISOString() };
      }
      if (endDate) {
        var tomorrow = new Date(endDate);
        tomorrow.setDate(tomorrow.getDate() + 1).toString();
        date_query = { ...date_query, [Op.lt]: tomorrow.toISOString() };
      }
      if (startDate || endDate)
        query = {
          ...query,
          createdAt: date_query,
        };
      // TODO:MARYAM  filter.phrase => mobile

      this.findAndCountAll({
        where: query,
        include: [
          {
            model: DataAccess.Models["users"],
            as: "creator",
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
              },
            ],
          },
          {
            model: DataAccess.Models["profileTypes"],
          },
          {
            model: DataAccess.Models["businessTypes"],
          },
          {
            model: DataAccess.Models["profileGrades"],
          },
        ],
        offset: page_number * items_per_page,
        limit: items_per_page,
        order: orderArr.length > 0 ? orderArr : [["id", "ASC"]],
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   *
   * @param {String} phrase
   */
  searchByPhrase(phrase: string) {
    this.referrerOption = {
      user: null,
      apiName: "searchByPhrase",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      DataAccess.Models[this.entity]
        .count({
          where: {
            [Op.or]: [
              Sequelize.where(
                Sequelize.fn("lower", Sequelize.col("firstName")),
                {
                  [Op.like]: "%" + phrase.toLowerCase() + "%",
                }
              ),
              Sequelize.where(
                Sequelize.fn("lower", Sequelize.col("lastName")),
                {
                  [Op.like]: "%" + phrase.toLowerCase() + "%",
                }
              ),
              Sequelize.where(Sequelize.fn("lower", Sequelize.col("email")), {
                [Op.like]: "%" + phrase.toLowerCase() + "%",
              }),
              {
                "basicInfo.mobile": {
                  [Op.like]: "%" + phrase.toLowerCase() + "%",
                },
              },
            ],
          },
        })
        .then((profiles) => {
          resolve({ count: profiles });
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   *
   * @param {Array} profileIds Array of numbers like : [1,2,3,4,5,...]
   * @param {Number} operatorId
   */
  updateAssignToOperator(
    loggedInUser: any,
    profileIds: number[],
    operatorId: number
  ) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "updateAssignToOperator",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          id: {
            [Op.or]: profileIds,
          },
        },
      })
        .then((profile_result: any) => {
          profile_result.forEach((item, index) => {
            item.dataValues.operatorUserId = operatorId;
            this.update(item.dataValues)
              .then((result) => resolve(result))
              .catch((err) => RejectHandler(reject, err));
          });
        })
        .catch((err) => {
          RejectHandler(
            reject,
            err,
            "Profile not found!",
            HTTPStatusCode.Forbidden
          );
        });
    });
  }

  /** @description Tries to log out and clear all tokens of current logged in user.
     * @param {User} loggedInUser logged in user with body : {
            id: user.guid,
            userId: user.id,
            profileId: user.individualProfileId,
            roles: user.roles,
            firstName: ser.individualProfile.firstName,
            lastName: user.individualProfile.lastName
          }
          **/
  updateMe(item: profile, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "updateMe",
      apiType: "PUT",
    };
    // TODO: Check Profile Id is in profiles field of the Logged in user
    return new Promise((resolve, reject) => {
      let profile_point_mgm = new ProfilePointsManager();
      this.findOne(
        item.id ? item.id.toString() : loggedInUser.profileId.toString()
      )
        .then((profile_result) => {
          var profile = profile_result[0]["dataValues"];
          // Check if basicInfo is null and set to empty array
          if (!profile.basicInfo) profile.basicInfo = new Array();

          // Check if the keys in the basicInfo are exist for update and insert them
          Object.keys(profile.basicInfo).forEach((element) => {
            var isExist = false;
            Object.keys(item.basicInfo).forEach((incomming) => {
              if (element == incomming) isExist = true;
            });
            if (!isExist) item.basicInfo[element] = profile.basicInfo[element];
          });
          item.id = profile.id;
          item.isLock = true;
          if (profile.id === loggedInUser.profileId) item.isApproved = true;
          else item.isApproved = null;
          this.update(item)
            .then((result) => {
              let oUserProfileMgm = new UserProfilesManager();
              oUserProfileMgm
                .findMe(loggedInUser)
                .then((result) => {
                  profile_point_mgm
                    .insertPointForAction(loggedInUser.profileId, 2, true)
                    .then((result) => {
                      resolve(result);
                    })
                    .catch((err) => RejectHandler(reject, err));
                })
                .catch((err) => RejectHandler(reject, err));
            })
            .catch((err) => RejectHandler(reject, err));
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  updateLogo(item: profile, loggedInUser: any) {
    // TODO: Check Profile Id is in profiles field of the Logged in user
    return new Promise((resolve, reject) => {
      let profile_point_mgm = new ProfilePointsManager();
      this.findOne(
        item.id ? item.id.toString() : loggedInUser.profileId.toString()
      )
        .then((profile_result) => {
          var profile = profile_result[0]["dataValues"];
          // Check if basicInfo is null and set to empty array
          if (!profile.basicInfo) profile.basicInfo = new Array();

          profile.basicInfo.logo = item.basicInfo["logo"];

          this.update(profile)
            .then((result) => {
              let oUserProfileMgm = new UserProfilesManager();
              oUserProfileMgm
                .findMe(loggedInUser)
                .then((result) => {
                  profile_point_mgm
                    .insertPointForAction(loggedInUser.profileId, 2, true)
                    .then((result) => {
                      resolve(result);
                    })
                    .catch((err) => {
                      reject(err);
                    });
                })
                .catch((error) => {
                  reject(error);
                });
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * @description updates evaluation result by the recieved object id
   * @param {Object} item with body of {id,status,profileGradeId,message,subject}
   */
  updateEvaluationResult(item: any, cookie: any) {
    this.referrerOption = {
      user: null,
      apiName: "updateEvaluationResult",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      let user_point_mgm = new ProfilePointsManager();
      let user_profile_mgm = new UserProfilesManager();
      var oprofileCommissionMgm = new ProfileCommissionsManager();
      this.find({
        where: {
          id: item.id,
        },
        include: [
          {
            model: DataAccess.Models["users"],
            as: "creator",
          },
        ],
      })
        .then((profile_result: any) => {
          var profile = profile_result[0].dataValues;
          if (item.subject === "DissApproved Profile" && item.status == -1)
            user_profile_mgm
              .find({
                where: {
                  profileId: profile.id,
                },
              })
              .then((user_profile_result: any) => {
                let user_profile = user_profile_result[0]["dataValues"];
                user_profile_mgm.delete(user_profile.id).then((result) => {
                  this.delete(profile.id)
                    .then((result) => resolve(result))
                    .catch((err) => RejectHandler(reject, err));
                });
              });
          else {
            let profileId = profile.id;
            profile.isApproved = item.status == 1 ? true : false;
            profile.isActive = item.status == 1 ? true : false;
            profile.isLock = false;
            // profile.profileGradeId = item.profileGradeId;
            profile.profileGradeId = 7;
            this.update(profile)
              .then((result) => {
                ExternalRequest.syncPostRequest(
                  process.env.MAIN_URL + "ticket/knowledgebase",
                  {
                    id: 0,
                    message: item.message,
                    subject: item.subject,
                    userId: profile.creatorUserId,
                  },
                  undefined,
                  undefined,
                  cookie
                )
                  .then((result) => {
                    // oprofileCommissionMgm
                    //   .insertAllCommissionRules(
                    //     profileId,
                    //     profile.profileTypeId,
                    //     //item.profileGradeId
                    //     7
                    //   )
                    //   .then(result => {
                    user_point_mgm
                      .insertPointForAction(
                        profile.creator.individualProfileId,
                        5,
                        true
                      )
                      .then((result) => {
                        resolve(result);
                      })
                      .catch((err) => RejectHandler(reject, err));
                    // })
                    // .catch(err =>
                    //   RejectHandler(reject, err));
                  })
                  .catch((err) => RejectHandler(reject, err));
              })
              .catch((err) => {
                reject(err);
              })
              .catch((err) =>
                RejectHandler(
                  reject,
                  err,
                  "Profile not found!",
                  HTTPStatusCode.Forbidden
                )
              );
          }
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /** @description Tries to log out and clear all tokens of current logged in user.
     * @param {User} loggedInUser logged in user with body : {
            id: user.guid,
            userId: user.id,
            profileId: user.individualProfileId,
            roles: user.roles,
            firstName: ser.individualProfile.firstName,
            lastName: user.individualProfile.lastName
          }
          **/
  changeAvatar(avatar: string, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "changeAvatar",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      this.findOne(loggedInUser.profileId)
        .then((user_result) => {
          user_result[0].basicInfo.avatar = avatar;
          this.update(user_result[0]["dataValues"])
            .then((result) => {
              resolve(result);
            })
            .catch((err) => RejectHandler(reject, err));
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   * @param {Array} id_list with body like :[1,2,3,4,5,...]        **/
  getByList(id_list: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByList",
      apiType: "POSt",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          id: id_list,
        },
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   *
   * @param item with body like : {email,profileId,roleId,departmentId,}
   */
  updateInvitation(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "updateInvitation",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      let userMgr = new UsersManager();
      userMgr
        .find({
          include: [
            {
              model: DataAccess.Models["profiles"],
              as: "individualProfile",
            },
          ],
          where: {
            userName: item.email.toLowerCase(),
          },
        })
        .then((user_result) => {
          let profile =
            user_result[0]["dataValues"].individualProfile["dataValues"];
          if (!profile.invitedProfiles) profile.invitedProfiles = [];
          if (
            profile.invitedProfiles.findIndex(
              (inv) => inv.profileId == item.profileId
            ) >= 0
          )
            profile.invitedProfiles.splice(
              profile.invitedProfiles.findIndex(
                (inv) => inv.profileId == item.profileId
              ),
              1
            );
          profile.invitedProfiles.push({
            profileId: item.profileId,
            role: item.roleId,
            department: item.departmentId,
          });
          this.update(profile)
            .then((result) => {
              resolve(result);
            })
            .catch((err) => RejectHandler(reject, err));
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   * 
   * @param item with body like : {profileId,roleId,departmentId,isAccept}
   * *  @param {User} loggedInUser logged in user with body : {
            id: user.guid,
            userId: user.id,
            profileId: user.individualProfileId,
            roles: user.roles,
            firstName: ser.individualProfile.firstName,
            lastName: user.individualProfile.lastName
          }
   */
  updateAcceptInvitation(item: any, loggedInUser: any) {
    this.referrerOption = {
      user: null,
      apiName: "updateAcceptInvitation",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      let userProfilesMgm = new UserProfilesManager();
      this.findOne(loggedInUser.profileId)
        .then((profile_result) => {
          let profile = profile_result[0]["dataValues"];
          let invite_index = profile.invitedProfiles.findIndex(
            (prf) =>
              prf.profileId == item.profileId &&
              prf.role == item.roleId &&
              prf.department == item.departmentId
          );
          profile.invitedProfiles =
            invite_index == 0 && profile.invitedProfiles.length == 1
              ? []
              : profile.invitedProfiles.splice(invite_index, 1);
          this.update(profile)
            .then((result) => {
              if (item.isAccept) {
                let _userProfile = new userProfile();
                _userProfile.departmentId = item.departmentId;
                _userProfile.profileId = item.profileId;
                _userProfile.roles = [item.roleId];
                _userProfile.userId = loggedInUser.userId;
                _userProfile.isActive = true;
                userProfilesMgm
                  .create(_userProfile)
                  .then((user_profile_result) => {
                    resolve(user_profile_result);
                  })
                  .catch((err) => RejectHandler(reject, err));
              } else resolve(result);
            })
            .catch((err) => RejectHandler(reject, err));
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   * 
   *  @param {User} loggedInUser logged in user with body : {
            id: user.guid,
            userId: user.id,
            profileId: user.individualProfileId,
            roles: user.roles,
            firstName: ser.individualProfile.firstName,
            lastName: user.individualProfile.lastName
          }
   */
  getFirstInvitation(loggedInUser: any) {
    this.referrerOption = {
      user: null,
      apiName: "getFirstInvitation",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      let roleMgm = new RolesManager();
      let departmentMgm = new ProfileDepartmentsManager();
      this.findOne(loggedInUser.profileId)
        .then((profile_result) => {
          let profile = profile_result[0]["dataValues"];
          if (profile.invitedProfiles && profile.invitedProfiles.length) {
            this.findOne(profile.invitedProfiles[0].profileId)
              .then((result: any) => {
                roleMgm
                  .findOne(profile.invitedProfiles[0].role)
                  .then((role_result: any) => {
                    departmentMgm
                      .findOne(profile.invitedProfiles[0].department)
                      .then((department_result: any) => {
                        resolve({
                          profile: result[0]["dataValues"].displayName,
                          role: role_result[0],
                          department: department_result[0],
                        });
                      })
                      .catch((err) => RejectHandler(reject, err));
                  })
                  .catch((err) => RejectHandler(reject, err));
              })
              .catch((err) => RejectHandler(reject, err));
          } else resolve({});
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   *
   * @param item with body like : {profileId,gradeId}
   */
  updateGrade(item: any) {
    return new Promise((resolve, reject) => {
      this.findOne(item.profileId)
        .then((result) => {
          let profile = result[0]["dataValues"];
          profile.profileGradeId = item.gradeId;
          this.update(profile)
            .then((result) => {
              resolve(result);
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   *
   * @param profileId selected active profileId
   */
  setActiveProfile(profileId: string, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "setActiveProfile",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      let user_profile_mgm = new UserProfilesManager();
      user_profile_mgm
        .find({ where: { userId: loggedInUser.userId } })
        .then((prof_result: any) => {
          prof_result = prof_result.map((prof) => prof.profileId);
          if (
            prof_result.indexOf(parseInt(profileId)) != -1 ||
            parseInt(profileId) == loggedInUser.profileId
          ) {
            let newToken = {
              ...loggedInUser,
              activeProfileId: parseInt(profileId),
            };
            resolve(newToken);
          } else
            RejectHandler(
              reject,
              {},
              "This user does not have permission to set this profile as active profile",
              HTTPStatusCode.Unauthorized
            );
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /**
   *
   */
  getActiveProfile(loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getActiveProfile",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      resolve(loggedInUser.activeProfileId);
    });
  }

  /**
   * @param {Object} result {success,isActive,user:{id,guid,idividualProfileId,roles,firstName,lastName},jid}
   */
  setJWTCookie(res: any, newToken: any) {
    let token = null;
    let payload = {
      id: newToken.id,
      userId: newToken.userId,
      profileId: newToken.profileId,
      roles: newToken.roles,
      firstName: newToken.firstName,
      lastName: newToken.lastName,
      activeProfileId: newToken.activeProfileId,
    };

    token = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: "HS384",
      expiresIn: "1d",
      issuer: "rota",
      jwtid: newToken.jti,
    });
    //TODO: set expiry for cookie
    res.cookie("token", token, {
      httpOnly: true,
      // sameSite: "none",
    });
    ResponseHandler(
      res,
      {
        result: true,
        isIndividualProfile: payload.activeProfileId === payload.profileId,
      },
      null
    );
    //  ResponseHandler(res, true, null)
  }

  updateDataByAutomation(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "updateDataByAutomation",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      this.findOne(item.id)
        .then((profile_result) => {
          if (profile_result) {
            let profile = profile_result[0].dataValues;
            profile.firstName = item.firstName;
            profile.lastName = item.lastName;
            profile.email = item.email;
            Object.keys(item.basicInfo).forEach((incomming) => {
              profile.basicInfo[incomming] = item.basicInfo[incomming];
            });
            profile.displayName = {
              fa: `${item.firstName} ${item.lastName}`,
            };
            this.update(profile)
              .then((result) => {
                resolve(result);
              })
              .catch((err) => RejectHandler(reject, err));
          }
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  /*
body.businessType == 1 for business profiles
body.businessType == 2 for individuals frofile
  */
  getActiveBusinessProfilesByPaging(
    body: any,
    page_number: number,
    items_per_page: number
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getActiveBusinessProfilesByPaging",
      apiType: "POST",
    };
    let _orderBy: any = [["id", "DESC"]];
    _orderBy = Sequelize.literal("id DESC");
    return new Promise((resolve, reject) => {
      let query = {};
      query = { isApproved: true };

      if (body.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.basicInfo"),
                  "managerName"
                )
              ),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "fa"
                )
              ),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "en"
                )
              ),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.firstName")),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.lastName")),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.email")),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
          ],
        };
      if (body.businessType) {
        if (body.businessType == 1)
          query = {
            ...query,
            businessTypeId: { [Op.not]: null },
          };
        if (body.businessType == 2)
          query = {
            ...query,
            businessTypeId: { [Op.eq]: null },
          };
      }
      this.findAndCountAll({
        where: query,
        include: [
          {
            model: DataAccess.Models["users"],
            as: "creator",
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
              },
            ],
          },
          {
            model: DataAccess.Models["users"],
            as: "operator",
          },
          {
            model: DataAccess.Models["profileTypes"],
          },
          {
            model: DataAccess.Models["businessTypes"],
          },
          {
            model: DataAccess.Models["profileGrades"],
          },
        ],
        order: _orderBy,
        offset: page_number * items_per_page,
        limit: items_per_page,
      })
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result));
          let resultCount = 0;
          let resolveResult = () => {
            if (++resultCount == result.rows.length) resolve(result);
          };
          if (result.rows.length == 0) resolve(result);
          result.rows.forEach((profile) => {
            profile.creditAmountStatus = "expired";
            if (profile.creditAmount && profile.creditAmount.total > 0)
              profile.creditAmountStatus = "active";
            new CreditsManager()
              .calculateNumberOfProfileCredits(profile.id)
              .then((count) => {
                if (count == 0) profile.creditAmountStatus = "no_credit";
                profile.creditsCount = count;
                resolveResult();
              })
              .catch((err) => {
                RejectHandler(reject, err);
              });
            return profile;
          });
        })
        .catch((err) => {
          RejectHandler(reject, err);
        });
    });
  }

  updateCreditAmount(profileId: number, creditAmount: creditAmount) {
    return new Promise((resolve, reject) => {
      this.findOne(profileId)
        .then((profile_result) => {
          let profile = profile_result[0].dataValues;
          profile.creditAmount = creditAmount;
          return this.update(profile);
        })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          RejectHandler(
            reject,
            err,
            "An error occured while updating creditAmount"
          );
        });
    });
  }

  updateWalletAmount(profileId: number, walletAmount: walletAmount) {
    return new Promise((resolve, reject) => {
      this.findOne(profileId)
        .then((profile_result) => {
          let profile = profile_result[0].dataValues;
          profile.walletAmount = walletAmount;
          return this.update(profile);
        })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          RejectHandler(
            reject,
            err,
            "An error occured while updating creditAmount"
          );
        });
    });
  }

  getCreditWalletPoint(profileId: number) {
    return new Promise((resolve, reject) => {
      let finalResult = {
        creditAmount: 0,
        creditMoneyUnit: null,
        walletAmount: 0,
        walletMoneyUnit: null,
        pointAmount: 0,
        pointEquivalentPrice: 0,
        pointEquivalentMoneyUnit: null,
      };
      new CreditsManager()
        .recalculateCredit(profileId)
        .then((credit_result) => {
          finalResult.creditAmount = credit_result.remain;
          finalResult.creditMoneyUnit = credit_result.moneyUnit;
          return new WalletsManager().recalculateWallet(profileId);
        })
        .then((wallet_result) => {
          finalResult.walletAmount = wallet_result.remain;
          finalResult.walletMoneyUnit = wallet_result.moneyUnit;
          return new ProfilePointsManager().getMe({ profileId });
        })
        .then((profilePoint_result: any[]) => {
          finalResult.pointAmount = profilePoint_result.reduce(
            (total, currentValue) => total + currentValue.point,
            0
          );
          finalResult.pointEquivalentPrice = finalResult.pointAmount * 10000; // TODO :fix this
          finalResult.pointEquivalentMoneyUnit = finalResult.walletMoneyUnit; // TODO :fix this
          resolve(finalResult);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  getActiveBusinessProfilesHasCreditByPaging(
    body: any,
    page_number: number,
    items_per_page: number
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getActiveBusinessProfilesByPaging",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      let query = {};
      query = { isApproved: true };
      if (body.phrase)
        query = {
          ...query,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.basicInfo"),
                  "managerName"
                )
              ),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "fa"
                )
              ),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                "lower",
                Sequelize.fn(
                  "JSONB_EXTRACT_PATH_TEXT",
                  Sequelize.col("profiles.displayName"),
                  "en"
                )
              ),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.firstName")),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.lastName")),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
            Sequelize.where(
              Sequelize.fn("lower", Sequelize.col("profiles.email")),
              {
                [Op.like]: "%" + body.phrase.toLowerCase() + "%",
              }
            ),
          ],
        };
      if (body.businessType) {
        if (body.businessType == 1)
          query = {
            ...query,
            businessTypeId: { [Op.not]: null },
          };
        if (body.businessType == 2)
          query = {
            ...query,
            businessTypeId: { [Op.eq]: null },
          };
      }

      let creditQuery = {};
      if (body.createdEndDate) {
        let tempDate = new Date(body.createdEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        body.createdEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (body.expieryEndDate) {
        let tempDate = new Date(body.expieryEndDate + "T02:00:00Z");
        tempDate.setDate(tempDate.getDate() + 1);
        body.expieryEndDate = tempDate.toISOString().substr(0, 10);
      }
      if (body.creditStatusId)
        creditQuery = {
          ...creditQuery,
          creditStatusId: body.creditStatusId,
        };
      if (
        body.createdStartDate &&
        body.createdEndDate &&
        body.expieryStartDate &&
        body.expieryEndDate
      )
        creditQuery = {
          ...creditQuery,
          [Op.and]: [
            {
              expireDate: { [Op.gte]: body.expieryStartDate },
            },
            {
              expireDate: { [Op.lte]: body.expieryEndDate },
            },
            {
              createdAt: { [Op.gte]: body.createdStartDate },
            },
            {
              createdAt: { [Op.lte]: body.createdEndDate },
            },
          ],
        };
      else {
        if (body.createdStartDate && body.createdEndDate)
          creditQuery = {
            ...creditQuery,
            [Op.and]: [
              {
                createdAt: { [Op.gte]: body.createdStartDate },
              },
              {
                createdAt: { [Op.lte]: body.createdEndDate },
              },
            ],
          };
        else if (body.createdStartDate)
          creditQuery = {
            ...creditQuery,
            createdAt: { [Op.gte]: body.createdStartDate },
          };
        else if (body.createdEndDate)
          creditQuery = {
            ...creditQuery,
            createdAt: { [Op.lte]: body.createdEndDate },
          };
        if (body.expieryStartDate && body.expieryEndDate)
          creditQuery = {
            ...creditQuery,
            [Op.and]: [
              {
                expireDate: { [Op.gte]: body.expieryStartDate },
              },
              {
                expireDate: { [Op.lte]: body.expieryEndDate },
              },
            ],
          };
        else if (body.expieryStartDate)
          creditQuery = {
            ...creditQuery,
            expireDate: { [Op.gte]: body.expieryStartDate },
          };
        else if (body.expieryEndDate)
          creditQuery = {
            ...creditQuery,
            expireDate: { [Op.lte]: body.expieryEndDate },
          };
      }
      new CreditsManager()
        .find({ where: creditQuery })
        .then((credit_result) => {
          credit_result = JSON.parse(JSON.stringify(credit_result));
          query = {
            ...query,
            id: Array.from(new Set(credit_result.map((el) => el.profileId))),
          };
          return this.findAndCountAll({
            where: query,
            include: [
              {
                model: DataAccess.Models["users"],
                as: "creator",
                include: [
                  {
                    model: DataAccess.Models["profiles"],
                    as: "individualProfile",
                  },
                ],
              },
              {
                model: DataAccess.Models["users"],
                as: "operator",
              },
              {
                model: DataAccess.Models["profileTypes"],
              },
              {
                model: DataAccess.Models["businessTypes"],
              },
              {
                model: DataAccess.Models["profileGrades"],
              },
            ],
            order: ["id"],
            offset: page_number * items_per_page,
            limit: items_per_page,
          });
        })
        .then((result: any) => {
          result = JSON.parse(JSON.stringify(result));
          let resultCount = 0;
          let resolveResult = () => {
            if (++resultCount == result.rows.length) resolve(result);
          };
          if (result.rows.length == 0) resolve(result);
          result.rows.forEach((profile) => {
            profile.creditAmountStatus = "expired";
            if (profile.creditAmount && profile.creditAmount.total > 0)
              profile.creditAmountStatus = "active";
            new CreditsManager()
              .calculateNumberOfProfileCredits(profile.id)
              .then((count) => {
                if (count == 0) profile.creditAmountStatus = "no_credit";
                profile.creditsCount = count;
                resolveResult();
              })
              .catch((err) => RejectHandler(reject, err));
            return profile;
          });
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
}
Object.seal(ProfilesManager);
