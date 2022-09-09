var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { user } from "../../Common/Metadata/userMetadata";
import { ProfilesManager } from "./ProfilesManager";
import { UserProfilesManager } from "./UserProfilesManager";
import { ProfileCommissionsManager } from "./ProfileCommissionsManager";
import { ProfilePointsManager } from "./ProfilePointsManager";
import { profile } from "../../Common/Metadata/profileMetadata";
import { JWTsManager } from "./JWTsManager";
import { JWT } from "../../Common/Metadata/jwtMetadata";
import { Security } from "../../Repositories/Utility/Security";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import DataAccess = require("../../Repositories/Base/DataAccess");
import * as jwt from "jsonwebtoken";
import { ProfileTypesManager } from "./ProfileTypesManager";
import { ProfileGradesManager } from "./ProfileGradesManager";
import {
  RejectHandler,
  ResponseHandler,
} from "../../Repositories/Utility/ActionResult";
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";
export class UsersManager extends BaseRepository<user> {
  constructor() {
    super("users");
  }
  /**
   *
   * @param page_number
   * @param items_per_page
   * @param phrase
   */
  getByPaging(
    page_number: number,
    items_per_page: number,
    phrase: any,
    sort: any
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      let query = {};
      let relation: any = {};
      let _orderBy: any = [["createdAt", "DESC"]];
      if (sort) {
        _orderBy = [[sort.column, sort.orderType ? sort.orderType : "ASC"]];
        if (sort.isInclude)
          _orderBy = Sequelize.literal(
            `"${sort.column}" ${sort.orderType ? sort.orderType : "ASC"}`
          );
      }
      if (phrase)
        query = {
          [Op.or]: [
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("firstName")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("lastName")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("userName")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("email")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
          ],
        };
      relation = {
        model: DataAccess.Models["userProfiles"],
        include: [
          {
            model: DataAccess.Models["profiles"],
          },
        ],
      };
      this.findAndCountAll({
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "individualProfile",
            where: query,
            include: [
              {
                model: DataAccess.Models["profileGrades"],
              },
            ],
          },
          relation,
        ],
        order: _orderBy,
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
        distinct: true,
      })
        .then((result: any) => {
          result.rows.forEach((usr) => {
            let index = usr.userProfiles.findIndex(
              (usp) => usp.profileId == usr.individualProfileId
            );
            usr.userProfiles.splice(index, 1);
          });
          resolve({ result, flatItems: ["password"] });
        })
        .catch((err) => {
          RejectHandler(reject, err);
          console.log(err);
        });
    });
  }

  /**
   *
   * @param page_number
   * @param items_per_page
   * @param phrase
   * @param profileId
   */
  getByProfilePaging(
    page_number: number,
    items_per_page: number,
    phrase: any,
    sort: any,
    profileId: number
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getByPaging",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      let query = {};
      let relation: any = {};
      let _orderBy: any = [["createdAt", "DESC"]];
      if (sort) {
        _orderBy = [[sort.column, sort.orderType ? sort.orderType : "ASC"]];
        if (sort.isInclude)
          _orderBy = Sequelize.literal(
            `"${sort.column}" ${sort.orderType ? sort.orderType : "ASC"}`
          );
      }
      if (phrase)
        query = {
          [Op.or]: [
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("firstName")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("lastName")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("userName")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
            Sequelize.where(Sequelize.fn("lower", Sequelize.col("email")), {
              [Op.like]: "%" + phrase.toLowerCase() + "%",
            }),
          ],
        };
      relation = {
        model: DataAccess.Models["userProfiles"],
        include: [
          {
            model: DataAccess.Models["profiles"],
          },
        ],
      };
      let userProfileMgm = new UserProfilesManager();
      userProfileMgm
        .find({
          where: { profileId },
          attributes: ["userId"],
        })
        .then((userProfile_result: any) => {
          let userIds = userProfile_result.map((usp) => usp.userId);
          this.findAndCountAll({
            where: {
              id: {
                [Op.or]: userIds,
              },
            },
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
                where: query,
                include: [
                  {
                    model: DataAccess.Models["profileGrades"],
                  },
                ],
              },
              relation,
            ],
            order: _orderBy,
            offset:
              parseInt(page_number.toString()) *
              parseInt(items_per_page.toString()),
            limit: parseInt(items_per_page.toString()),
            distinct: true,
          })
            .then((result: any) => {
              result.rows.forEach((usr) => {
                let index = usr.userProfiles.findIndex(
                  (usp) => usp.profileId == usr.individualProfileId
                );
                usr.userProfiles.splice(index, 1);
              });
              resolve({ result, flatItems: ["password"] });
            })
            .catch((err) => {
              RejectHandler(reject, err);
              console.log(err);
            });
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  findAllWithIncludes() {
    this.referrerOption = {
      user: null,
      apiName: "findAllWithIncludes",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "individualProfile",
          },
        ],
        order: [["userName", "ASC"]],
      })
        .then((result) => {
          resolve({ result, flatItems: ["password"] });
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {Number} id
   * @param {Number} profileId
   */
  findOneWithIncludes(id: number, profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "findOneWithIncludes",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.query(
        'SELECT * FROM "fn_Users_GetByIdAndProfileId"(' +
          id +
          "," +
          profileId +
          ")",
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      )
        .then((users) => {
          // We don't need spread here, since only the results will be returned for select queries
          resolve(users);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {User} item with body like : {userName,isActive,password}
   */
  create(item: user) {
    this.referrerOption = {
      user: null,
      apiName: "create",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      item.userName = item.userName.toLowerCase();
      item.isActive = true;
      Security.hashText(item.password)
        .then((result: any) => {
          item.password = result;
          this.repository
            .grabInsert(this.entity, item)
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
   * @param item {basicInfo,firstName,lastName,email,individualProfileId,userName,isActive,id,password,roles,departmentId}
   */
  createEmployee(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "createEmployee",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      var profile_mgm = new ProfilesManager();
      var user_profile_mgm = new UserProfilesManager();
      delete item.basicInfo.mobileWithoutCode;
      if (item.id == 0) {
        var _profile = new profile();
        _profile.firstName = item.firstName;
        _profile.lastName = item.lastName;
        _profile.email = item.email;
        _profile.profileTypeId = 32; // TODO: Employee Profile
        _profile.displayName = { fa: `${item.firstName} ${item.lastName}` };
        _profile.basicInfo = item.basicInfo;
        _profile.isLock = false;
        _profile.isActive = true;
        profile_mgm
          .create(_profile)
          .then((profile_result) => {
            _profile = profile_result["dataValues"];
            item.individualProfileId = _profile.id;
            item.userName = item.userName.toLowerCase();
            item.isActive = true;
            let profileId = item.profileId;
            let individualProfileId = _profile.id;
            delete item.firstName;
            delete item.lastName;
            delete item.email;
            delete item.basicInfo;
            delete item.profileId;
            delete item.id;
            Security.hashText(item.password)
              .then((result) => {
                item.password = result;
                this.repository
                  .grabInsert(this.entity, item)
                  .then((user_result) => {
                    _profile.creatorUserId = user_result["dataValues"]["id"];
                    profile_mgm.update(_profile).then((prf_result) => {
                      user_profile_mgm
                        .create({
                          id: 0,
                          profileId: individualProfileId,
                          userId: user_result["dataValues"]["id"],
                          roles: [11],
                          departmentId: null,
                          isActive: true,
                        })
                        .then((user_profile_result) => {
                          user_profile_mgm
                            .create({
                              id: 0,
                              profileId: profileId,
                              userId: user_result["dataValues"]["id"],
                              roles: item.roles,
                              departmentId: item.departmentId,
                              isActive: true,
                            })
                            .then((user_profile_result) => {
                              // var oprofileCommissionMgm = new ProfileCommissionsManager();
                              // oprofileCommissionMgm
                              //   .insertAllCommissionRules(
                              //     item.individualProfileId,
                              //     32,
                              //     null
                              //   )
                              //   .then(result => {
                              //     console.log('erfsdfgs', result)
                              resolve(result);
                            })
                            .catch((err) => RejectHandler(reject, err));
                        })
                        .catch((err) => RejectHandler(reject, err));
                    });
                  })
                  .catch((err) => {
                    RejectHandler(
                      reject,
                      err,
                      "username is duplicated",
                      HTTPStatusCode.Forbidden
                    );
                  });
              })
              .catch((err) => RejectHandler(reject, err));
          })
          .catch((err) => RejectHandler(reject, err))
          .catch((err) => RejectHandler(reject, err));
      } else {
        user_profile_mgm
          .getWithAllDependencies(item.id)
          .then((user_profile_result) => {
            let user_profile = user_profile_result[0].dataValues;
            user_profile.user.userName = item.userName.toLowerCase();
            user_profile.roles = item.roles;
            this.update(user_profile.user.dataValues)
              .then((result) => {
                profile_mgm
                  .findOne(user_profile.user.dataValues.individualProfileId)
                  .then((profile_result) => {
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
                    profile_mgm.update(profile).then((result) => {
                      delete user_profile.user;
                      delete user_profile.profile;
                      user_profile.departmentId = item.departmentId;
                      user_profile_mgm
                        .update(user_profile)
                        .then((result) => {
                          resolve(result);
                        })
                        .catch((err) => RejectHandler(reject, err));
                    });
                  })
                  .catch((err) => RejectHandler(reject, err))
                  .catch((err) => RejectHandler(reject, err));
              })
              .catch((err) => RejectHandler(reject, err));
          })
          .catch((err) => RejectHandler(reject, err));
      }
    });
  }
  /**
   *
   * @param item {basicInfo,email,firstName,lastName,email,individualProfileId,userName,password}
   */
  createWithProfile(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "createWithProfile",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      let profile_mgm = new ProfilesManager();
      let _profile = new profile();
      let user_profile_mgm = new UserProfilesManager();
      let user_point_mgm = new ProfilePointsManager();
      let profile_type_mgm = new ProfileTypesManager();
      let profile_grade_mgm = new ProfileGradesManager();
      this.findByEmail(item.email)
        .then((res: any) => {
          if (res.length > 0)
            RejectHandler(
              reject,
              {},
              "userName must be unique",
              HTTPStatusCode.BadRequest
            );
          else
            profile_grade_mgm
              .findByCode("5")
              .then((profile_grade) => {
                profile_type_mgm
                  .findByCode("6")
                  .then((profile_type) => {
                    delete item.basicInfo.mobileWithoutCode;
                    _profile.firstName = item.firstName;
                    _profile.lastName = item.lastName;
                    _profile.email = item.email;
                    _profile.profileTypeId = profile_type[0].id; // TODO: Individual Profile
                    _profile.profileGradeId = profile_grade[0].id;
                    _profile.isLock = false;
                    _profile.isActive = true;
                    _profile.isApproved = true;
                    _profile.displayName = {
                      fa: `${item.firstName} ${item.lastName}`,
                    };
                    _profile.basicInfo = item.basicInfo;
                    profile_mgm
                      .create(_profile)
                      .then((profile_result) => {
                        _profile = profile_result["dataValues"];
                        item.individualProfileId = _profile.id;
                        item.userName = item.userName.toLowerCase();
                        item.isActive = true;
                        delete item.firstName;
                        delete item.lastName;
                        delete item.email;
                        delete item.basicInfo;
                        Security.hashText(item.password)
                          .then((result) => {
                            item.password = result;
                            this.repository
                              .grabInsert(this.entity, item)
                              .then((user_result) => {
                                _profile.creatorUserId =
                                  user_result["dataValues"]["id"];
                                profile_mgm
                                  .update(_profile)
                                  .then((prf_result) => {
                                    user_profile_mgm
                                      .create({
                                        id: 0,
                                        profileId: item.individualProfileId,
                                        userId: _profile.creatorUserId,
                                        roles: [11],
                                        departmentId: null,
                                        isActive: true,
                                      })
                                      .then((user_profile_result) => {
                                        // var oprofileCommissionMgm = new ProfileCommissionsManager();
                                        // oprofileCommissionMgm.insertAllCommissionRules(
                                        //   item.individualProfileId,
                                        //   23,
                                        //   null).then((pro_com_result) => {
                                        // user_point_mgm.insertPointForAction(
                                        //   item.individualProfileId,
                                        //   1,
                                        //   true).then((user_point_result) => {
                                        resolve(user_result);
                                        // }).catch((err) => {
                                        //   reject(err)
                                        // });
                                        // }).catch((err) => {
                                        //   reject(err)
                                        // });
                                      })
                                      .catch((err) =>
                                        RejectHandler(reject, err)
                                      );
                                  })
                                  .catch((err) => RejectHandler(reject, err));
                              })
                              .catch((err) => RejectHandler(reject, err));
                          })
                          .catch((err) => RejectHandler(reject, err));
                      })
                      .catch((err) => RejectHandler(reject, err));
                  })
                  .catch((err) => RejectHandler(reject, err));
              })
              .catch((err) => RejectHandler(reject, err));
        })
        .catch((err) => RejectHandler(reject, err));
      // profile_mgm.find({
      //   where: {
      //     userName: item.email.toLowerCase()
      //   },
      //   include: [
      //     {
      //       model: DataAccess.Models["profiles"],
      //       as: "individualProfile"
      //     }
      //   ]
      // })
      //   .then(res => {
      //     console.log("find email", res)
      //   }).catch(err => {
      //     // console.log("err 03", err)
      //     console.log("err find email", err)
      //     RejectHandler(reject, err)
      //   })
    });
  }
  /**
   *
   * @param {String} username
   * @param {String} password
   */
  login(username: string, password: string) {
    this.referrerOption = {
      user: null,
      apiName: "login",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      this.find({
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "individualProfile",
          },
          {
            model: DataAccess.Models["userProfiles"],
            where: Sequelize.where(
              Sequelize.col("userProfiles.profileId"),
              Sequelize.col("users.individualProfileId")
            ),
          },
        ],
        where: {
          userName: username.toLowerCase(),
        },
      })
        .then((result: any) => {
          if (result.length > 0) {
            Security.compareHash(password, result[0].password)
              .then((compare_result: any) => {
                if (compare_result) {
                  if (result[0].dataValues.isActive)
                    this.createJWT(result[0].dataValues, compare_result)
                      .then((result) => {
                        resolve(result);

                        // ExternalRequest.syncGetRequest(
                        //   'http://localhost:3008/' + "user_profile/users_by_business/" + profileId
                        // )
                      })
                      .catch((err) => RejectHandler(reject, err));
                  // reject(err)
                  else
                    resolve({
                      isActive: false,
                    });
                } else
                  RejectHandler(
                    reject,
                    {},
                    "User not found!",
                    HTTPStatusCode.Forbidden
                  );
              })
              .catch((err) => RejectHandler(reject, err));
          } else
            RejectHandler(
              reject,
              {},
              "User not found!",
              HTTPStatusCode.Forbidden
            );
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {User} _user with body like :{password}
   * @param {Boolean} compare_result
   */
  createJWT(_user: user, compare_result: boolean) {
    this.referrerOption = {
      user: null,
      apiName: "createJWT",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      var jwt_mgm = new JWTsManager();
      var jwt = new JWT();
      delete _user.password;
      jwt.guid = null;
      jwt.expireDate = new Date(
        new Date().setDate(
          new Date().getDate() + parseInt(process.env.JWT_VALIDITY_DAYS)
        )
      );
      jwt.userId = _user.id;
      jwt_mgm
        .create(jwt)
        .then((jwt_res) => {
          resolve({
            success: compare_result,
            user: _user,
            jid: jwt_res["guid"],
          });
          RejectHandler(
            reject,
            {},
            "Server fault!",
            HTTPStatusCode.InternalServerError
          );
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {Object} result {success,isActive,user:{id,guid,idividualProfileId,roles,firstName,lastName},jid}
   */
  setJWTCookie(res: any, err: any, result: any) {
    this.referrerOption = {
      user: null,
      apiName: "setJWTCookie",
      apiType: "POST",
    };
    if (err) ResponseHandler(res, null, err);
    else if (result.isActive == false) ResponseHandler(res, result, null);
    // res.send(result);
    else {
      let token = null;
      if (result.success) {
        let payload = {
          id: result.user.guid,
          userId: result.user.id,
          profileId: result.user.individualProfileId,
          roles: result.user.userProfiles[0].dataValues.roles,
          firstName: result.user.individualProfile.firstName,
          lastName: result.user.individualProfile.lastName,
          activeProfileId: result.user.individualProfileId,
        };

        token = jwt.sign(payload, process.env.JWT_SECRET, {
          algorithm: "HS384",
          expiresIn: process.env.JWT_VALIDITY_DAYS + "d",
          issuer: "rota",
          jwtid: result.jid,
        });
      }
      res.cookie("token", token, {
        httpOnly: true,
        // sameSite: "none",
        // secure: true,
        expires: new Date(
          new Date().setDate(
            new Date().getDate() + parseInt(process.env.JWT_VALIDITY_DAYS)
          )
        ),
      });
      ResponseHandler(res, result.success, null);
      // res.send(result.success);
    }
  }
  /**
   *
   * @param {String} email
   */
  findByEmail(email: string) {
    this.referrerOption = {
      user: null,
      apiName: "setJWfindByEmailTCookie",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          userName: email.toLowerCase(),
        },
        include: [
          {
            model: DataAccess.Models["profiles"],
            as: "individualProfile",
          },
        ],
      })
        .then((result) => {
          resolve(result);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {String} guid
   * @param {String} hash
   * @param {String} password
   */
  resetPassword(guid: string, hash: string, password: string) {
    this.referrerOption = {
      user: null,
      apiName: "resetPassword",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      this.find({
        include: [
          { model: DataAccess.Models["profiles"], as: "individualProfile" },
          {
            model: DataAccess.Models["userProfiles"],
            where: Sequelize.where(
              Sequelize.col("userProfiles.profileId"),
              Sequelize.col("users.individualProfileId")
            ),
          },
        ],
        where: { guid: guid },
      })
        .then((user_result: any) => {
          if (user_result.length > 0)
            Security.compareHash(user_result[0].guid, hash)
              .then((compare_result) => {
                if (compare_result)
                  ExternalRequest.syncPostRequest(
                    process.env.MAIN_URL + "expired_activity/check_hash",
                    { hash: hash, user_id: user_result[0].id }
                  )
                    .then((expired_result: any) => {
                      if (
                        expired_result.status === 200 &&
                        expired_result.payload.data
                      ) {
                        var user = user_result[0]["dataValues"];
                        var id = user.id;
                        user.password = password;
                        Security.hashText(user.password)
                          .then((result) => {
                            user.password = result;
                            this.update(user)
                              .then((upt_result) => {
                                user.id = id;
                                this.createJWT(user, true)
                                  .then((result) => {
                                    resolve(result);
                                  })
                                  .catch((err) => RejectHandler(reject, err));
                              })
                              .catch((err) => RejectHandler(reject, err));
                          })
                          .catch((err) => RejectHandler(reject, err));
                      } else
                        RejectHandler(
                          reject,
                          {},
                          "Verify link has been expired!"
                        );
                    })
                    .catch((err) => RejectHandler(reject, err));
                else
                  RejectHandler(
                    reject,
                    {},
                    "Verify link has been expired!",
                    HTTPStatusCode.BadRequest
                  );
              })
              .catch((err) => RejectHandler(reject, err));
          else
            RejectHandler(
              reject,
              {},
              "User not found!",
              HTTPStatusCode.Forbidden
            );
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**@param  {Object} item {userName,googleId} */
  signupOrLoginWithGoogle(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "signupOrLoginWithGoogle",
      apiType: "POST",
    };
    return new Promise((resolve, reject) => {
      this.findByEmail(item.userName.toLowerCase())
        .then((result: any) => {
          if (result.length > 0) {
            var user = result[0];
            if (user.individualProfile.basicInfo.googleId == item.googleId) {
              this.createJWT(result[0].dataValues, true)
                .then((result) => {
                  resolve(result);
                })
                .catch((err) => RejectHandler(reject, err));
            } else
              RejectHandler(
                reject,
                {},
                "Google token is not valid!",
                HTTPStatusCode.Forbidden
              );
          } else {
            this.createWithProfile(item)
              .then((user_result: any) => {
                if (user_result) {
                  this.createJWT(user_result.dataValues, true)
                    .then((result) => {
                      resolve(result);
                    })
                    .catch((err) => {
                      RejectHandler(reject, err);
                    });
                }
              })
              .catch((err) => {
                RejectHandler(reject, err);
              });
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
   */
  changePassword(old_password: string, password: string, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "changePassword",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      this.findOne(loggedInUser.userId)
        .then((user_result: any) => {
          if (user_result) {
            // Check old password is correct
            Security.compareHash(old_password, user_result[0].password)
              .then((compare_result) => {
                if (compare_result) {
                  // Update new password
                  Security.hashText(password)
                    .then((result) => {
                      var user = user_result[0].dataValues;
                      user.password = result;
                      this.repository
                        .grabUpdate(this.entity, [user])
                        .then((result) => {
                          resolve(result);
                        })
                        .catch((err) => RejectHandler(reject, err));
                    })
                    .catch((err) => RejectHandler(reject, err));
                } else
                  RejectHandler(
                    reject,
                    {},
                    "Old password is not match!",
                    HTTPStatusCode.Forbidden
                  );
              })
              .catch((err) => RejectHandler(reject, err));
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
   */
  getMe(loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getMe",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      let profile_point_mgm = new ProfilePointsManager();
      DataAccess.ModelInstance.query(
        'SELECT * FROM "fn_Users_GetInformation_GetRole_ById"(' +
          loggedInUser.userId +
          ")",
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      ).then((users) => {
        profile_point_mgm
          .getMe(loggedInUser)
          .then((result: any) => {
            // We don't need spread here, since only the results will be returned for select queries
            if (users.length > 0) users[0].totalPoints = result.totalPoints;
            resolve(users);
          })
          .catch((err) => RejectHandler(reject, err));
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
   */
  updateMe(item: user, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "updateMe",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      item.id = loggedInUser.userId;
      this.findOne(item.id.toString())
        .then((user_result) => {
          if (user_result) {
            var user = user_result[0]["dataValues"];
            this.update(item)
              .then((result) => {
                resolve(result);
              })
              .catch((err) => RejectHandler(reject, err));
          }
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {Number} profileId
   * @param page_number
   * @param items_per_page
   */
  getByProfileId(
    phrase: string,
    departmentId: number = 0,
    roleId: number = 0,
    profileId: number,
    page_number: number,
    items_per_page: number
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "GET",
    };
    return new Promise((resolve, reject) => {
      DataAccess.ModelInstance.query(
        'SELECT * FROM "fn_Users_GetByProfileId"(' +
          "'" +
          phrase +
          "'," +
          departmentId +
          "," +
          roleId +
          "," +
          profileId +
          "," +
          page_number * items_per_page +
          "," +
          items_per_page +
          ")",
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      )
        .then((users) => {
          // We don't need spread here, since only the results will be returned for select queries
          resolve(users);
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {Object} item with body like {id,isActive}
   */
  blockUser(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "blockUser",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      this.findOne(item.id.toString())
        .then((user_result) => {
          if (user_result) {
            user_result[0].isActive = item.isActive;
            if (item.isActive == false) {
              new JWTsManager().blockUser(item.id);
            }
            this.update(user_result[0]["dataValues"])
              .then((result) => {
                resolve(result);
              })
              .catch((err) => RejectHandler(reject, err));
          }
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
  /**
   *
   * @param {Array} id_list An array of integers like : [1,2,3,4,5,...]
   */
  getByList(id_list: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByList",
      apiType: "POST",
    };
    return this.find({
      include: [
        { model: DataAccess.Models["profiles"], as: "individualProfile" },
      ],
      where: { id: id_list },
    });
  }

  getByIndividualProfileId(profileId: number) {
    return this.find({ where: { individualProfileId: profileId } });
  }

  checkSecondPassword(individualProfileId: number, password: string) {
    this.referrerOption = {
      user: null,
      apiName: "",
      apiType: "",
    };
    return new Promise((resolve, reject) => {
      this.find({
        where: { individualProfileId },
      })
        .then((result: any) => {
          if (result.length > 0) {
            if (result[0].secondPassword) {
              Security.compareHash(password, result[0].secondPassword)
                .then((compare_result: any) => {
                  if (compare_result) {
                    if (result[0].dataValues.isActive)
                      this.createJWT(result[0].dataValues, compare_result)
                        .then((result) => {
                          resolve(result);
                        })
                        .catch((err) => RejectHandler(reject, err));
                    else
                      resolve({
                        isActive: false,
                      });
                  } else
                    RejectHandler(
                      reject,
                      {},
                      "Wrong password!",
                      HTTPStatusCode.Forbidden
                    );
                })
                .catch((err) => RejectHandler(reject, err));
            } else
              RejectHandler(
                reject,
                {},
                "Second password is not set!",
                HTTPStatusCode.Unauthorized
              );
          } else
            RejectHandler(
              reject,
              {},
              "User not found!",
              HTTPStatusCode.NotFound
            );
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }

  changeSecondPassword(
    old_password: string,
    secondPassword: string,
    userId: any
  ) {
    this.referrerOption = {
      userId: userId,
      apiName: "changeSecondPassword",
      apiType: "PUT",
    };
    return new Promise((resolve, reject) => {
      this.findOne(userId)
        .then((user_result: any) => {
          if (user_result) {
            if (user_result[0].secondPassword) {
              // if there was secondPassword before
              // Check old password is correct
              Security.compareHash(old_password, user_result[0].secondPassword)
                .then((compare_result) => {
                  if (compare_result) {
                    // Update new password
                    Security.hashText(secondPassword)
                      .then((result) => {
                        var user = user_result[0].dataValues;
                        user.secondPassword = result;
                        this.repository
                          .grabUpdate(this.entity, [user])
                          .then((result) => {
                            resolve(result);
                          })
                          .catch((err) => RejectHandler(reject, err));
                      })
                      .catch((err) => RejectHandler(reject, err));
                  } else
                    RejectHandler(
                      reject,
                      {},
                      "Old password is not match!",
                      HTTPStatusCode.Forbidden
                    );
                })
                .catch((err) => {
                  console.log(err);
                  RejectHandler(reject, err);
                });
            } else {
              //if it is the first time for setting secondPassword
              Security.hashText(secondPassword)
                .then((result) => {
                  var user = user_result[0].dataValues;
                  user.secondPassword = result;
                  this.repository
                    .grabUpdate(this.entity, [user])
                    .then((result) => {
                      resolve(result);
                    })
                    .catch((err) => {
                      console.log(err);
                      RejectHandler(reject, err);
                    });
                })
                .catch((err) => {
                  console.log(err);
                  RejectHandler(reject, err);
                });
            }
          }
        })
        .catch((err) => RejectHandler(reject, err));
    });
  }
}
Object.seal(UsersManager);
