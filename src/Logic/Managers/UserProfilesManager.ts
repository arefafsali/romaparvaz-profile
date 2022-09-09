var Sequelize = require("sequelize");
var Op = Sequelize.Op;
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { userProfile } from "../../Common/Metadata/userProfileMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RolesManager } from "./RolesManager";
import { EmployeeAllocationsManager } from "./EmployeeAllocationsManager";
import { UsersManager } from "./UsersManager";
import { PermissionsManager } from "./PermissionsManager";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"

export class UserProfilesManager extends BaseRepository<userProfile> {
  constructor() {
    super("userProfiles");
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
  findMe(loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "findMe",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      let _usersMgm = new UsersManager();
      let oRoleMgm = new RolesManager();
      let oPermissionMgm = new PermissionsManager();
      this.find({
        where: { userId: loggedInUser.userId },
        include: [
          {
            model: DataAccess.Models["profiles"],
            // where: { profileTypeId: { [Op.notIn]: [23, 32] } },
            include: [
              {
                model: DataAccess.Models["profileGrades"]
              },
              {
                model: DataAccess.Models["businessTypes"]
              }
            ]
          },
          {
            model: DataAccess.Models["users"],
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile",
                include: [
                  {
                    model: DataAccess.Models["profileGrades"]
                  }
                ]
              }
            ]
          }
        ]
      })
        .then((result: any) => {
          let roleArray = [];
          let permissionArray = [];
          result.forEach(res => {
            roleArray.push(...res.roles);
          });
          oRoleMgm
            .getByList(roleArray)
            .then((role_result: any) => {
              role_result.forEach(role => {
                if (role.permissions) permissionArray.push(...role.permissions);
              });
              oPermissionMgm
                .getByList([...new Set(permissionArray)])
                .then((permission_result: any) => {
                  result.forEach(element => {
                    let roles = [];
                    let permissions = [];
                    let permission_array = [];
                    roles = [
                      ...role_result.filter(rol =>
                        element.roles.includes(rol.id)
                      )
                    ];
                    roles.forEach(rol => {
                      if (rol.permissions)
                        permission_array.push(...rol.permissions);
                    });
                    permission_array = [...new Set(permission_array)];
                    permission_array.forEach(per_element => {
                      permissions.push(
                        ...permission_result.filter(
                          per => per.id == per_element
                        )
                      );
                    });
                    element.dataValues.roles = roles;
                    element.dataValues.permissions = permissions.map(
                      per => per.name.en
                    );
                  });
                  _usersMgm.getMe(loggedInUser).then((user_result: any) => {
                    let individual_profile = result.find(usp => usp.profile.profileTypeId == 23 || usp.profile.profileTypeId == 32);
                    user_result[0].roles = individual_profile ? individual_profile.roles : []
                    user_result[0].profileGradeId = individual_profile ? individual_profile.profile.profileGradeId : 0;
                    user_result[0].profileGrade = individual_profile ? individual_profile.profile.profileGrade : null;
                    user_result[0].invitedProfiles = individual_profile.profile.invitedProfiles;
                    result.splice(result.findIndex(usp => usp.profile.profileTypeId == 23 || usp.profile.profileTypeId == 32), individual_profile ? 1 : 0)
                    resolve({ user: user_result, profiles: result });
                  })
                })
                .catch(err =>
                  RejectHandler(reject, err));
            })
            .catch(err => {
              RejectHandler(reject, err)
            });
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  /**
     * @param {Array} id_list with body like :[1,2,3,4,5,...]        **/
  checkPermission(
    loggedInUser: any,
    profileId: number,
    permissionName: string
  ) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "checkPermission",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: { userId: loggedInUser.userId, profileId: profileId }
      })
        .then((profie_result: any) => {
          let oRoleMgm = new RolesManager();
          let oPermissionMgm = new PermissionsManager();
          let roleArray = [];
          let permissionArray = [];
          let result = false;
          profie_result.forEach(res => {
            roleArray.push(...res.roles);
          });
          if (profie_result.length > 0 && roleArray.length > 0) {
            oRoleMgm
              .getByList(roleArray)
              .then((role_result: any) => {
                role_result.forEach(role => {
                  permissionArray.push(...role.permissions);
                });
                if (permissionArray.length > 0) {
                  oPermissionMgm
                    .getByList([...new Set(permissionArray)])
                    .then((permission_result: any) => {
                      result =
                        permission_result.filter(
                          item =>
                            item.name.en.toLowerCase() ==
                            permissionName.toLowerCase()
                        ).length > 0;
                      resolve(result);
                    })
                    .catch(err =>
                      RejectHandler(reject, err));
                } else resolve(result);
              })
              .catch(err =>
                RejectHandler(reject, err));
          } else
            resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  checkPermissionList(loggedInUser: any, permissionList: string[]) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "checkPermissionList",
      apiType: "POST"
    }
    return new Promise<boolean>((resolve, reject) => {
      this.find({
        where: { userId: loggedInUser.userId, profileId: loggedInUser.activeProfileId }
      })
        .then((profie_result: any) => {
          let oRoleMgm = new RolesManager();
          let oPermissionMgm = new PermissionsManager();
          let roleArray = [];
          let permissionArray = [];
          let result = false;
          profie_result.forEach(res => {
            roleArray.push(...res.roles);
          });
          if (roleArray.length > 0) {
            oRoleMgm.getByList(roleArray)
              .then((role_result: any) => {
                role_result.forEach(role => {
                  if (role.permissions)
                    permissionArray.push(...role.permissions);
                });
                if (permissionArray.length > 0) {
                  oPermissionMgm.getByList([...new Set(permissionArray)])
                    .then((permission_result: any) => {
                      permission_result = permission_result.filter(el => el.name && el.name.en).map(el => el.name.en.toLowerCase());
                      result = permissionList.every(el => permission_result.indexOf(el.toLowerCase()) >= 0);
                      resolve(result);
                    })
                    .catch(err => {
                      RejectHandler(reject, err);
                    });
                } else resolve(result);
              })
              .catch(err => {
                RejectHandler(reject, err);
              });
          } else
            resolve(result);
        })
        .catch(err => {
          RejectHandler(reject, err)
        });
    });
  }

  /**
     * @param {Array} id_list with body like :[1,2,3,4,5,...]        **/
  checkRole(
    loggedInUser: any,
    roleName: string
  ) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "checkRole",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: { userId: loggedInUser.userId, profileId: loggedInUser.profileId }
      })
        .then((profie_result: any) => {
          let oRoleMgm = new RolesManager();
          let roleArray = [];
          let result = false;
          profie_result.forEach(res => {
            roleArray.push(...res.roles);
          });
          if (profie_result.length > 0 && roleArray.length > 0) {
            oRoleMgm.getByList(roleArray)
              .then((role_result: any) => {
                result = role_result.some(item => item.name.en.toLowerCase() == roleName.toLowerCase());
                resolve(result);
              })
              .catch(err =>
                RejectHandler(reject, err));
          } else
            resolve(result);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  /**
  * 
  * @param {Number} roleId 
  */
  getCountByRole(roleId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getCountByRole",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      DataAccess.Models[this.entity]
        .count({
          where: {
            roles: {
              [Op.contains]: [roleId]
            }
          }
        })
        .then(profiles => {
          resolve({ count: profiles });
        });
    });
  }

  /**
     * @param {Array} id_list with body like :[1,2,3,4,5,...]        **/
  getByRoleList(id_list: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByRoleList",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        include: [
          {
            model: DataAccess.Models["users"],
            include: [
              {
                model: DataAccess.Models["profiles"],
                as: "individualProfile"
              }
            ]
          }
        ],
        where: {
          roles: id_list
        }
      })
        .then((result: any) => {
          let returnList = [];
          result.forEach((res: any) => {
            if (res.userId && !returnList.some(usr => usr.id == res.userId))
              returnList.push(res.dataValues.user["dataValues"]);
          });
          resolve(returnList);
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  /**
   * 
   * @param id an id string
   */
  getWithAllDependencies(id: any) {
    this.referrerOption = {
      user: null,
      apiName: "getByRoleList",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          id: id
        },
        include: [
          {
            model: DataAccess.Models["profiles"]
          },
          {
            model: DataAccess.Models["users"]
          }
        ]
      }).then(result => {
        resolve(result);
      })
        .catch(err =>
          RejectHandler(reject, err));
    }
    )
  }

  /**
   * 
   * @param {Number} userId 
   * @param {Number} profileId 
   */
  getByUserId(userId: number, profileId) {
    this.referrerOption = {
      user: null,
      apiName: "getByUserId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          userId,
          profileId
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
   * @param item {userId,profileId,roles}
   */
  updateAsseignedRole(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "updateAsseignedRole",
      apiType: "PUT"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          userId: item.userId,
          profileId: item.profileId
        }
      })
        .then(user_result => {
          user_result[0].roles = item.roles;
          this.update(user_result[0]["dataValues"])
            .then(result => {
              resolve(result);
            })
            .catch(err =>
              RejectHandler(reject, err));
        })
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  /**
   * 
   * @param {Number} profileId 
   */
  getUsersByBusinessProfile(
    profileId: number,
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getUsersByBusinessProfile",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find(
        {
          where: {
            profileId
          },
          include: [
            {
              model: DataAccess.Models["users"],
              include: ["individualProfile"]
            }
          ]
        }).then((result) => {
          resolve(result)
        }).catch((err) => {
          RejectHandler(reject, err)
        })
    })
  }

  getEmployeesByBusinessProfileMe(
    loggedInUser: any,
  ) {
    this.referrerOption = {
      user: null,
      apiName: "getEmployeesByBusinessProfileMe",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find(
        {
          where: {
            userId: loggedInUser.userId
          }
        }).then((profile_result: any) => {
          if (profile_result.length > 1) {
            let profileIds = [
              ...new Set(
                profile_result.map(res => res.profileId)
              )
            ];
            let _usersMgm = new UsersManager();
            let oRoleMgm = new RolesManager();
            this.find(
              {
                where: {
                  profileId: { [Op.in]: profileIds }
                },
                include: [
                  {
                    model: DataAccess.Models["profileDepartments"]
                  }
                ]
              }).then((result: any) => {
                let roleArray = [];
                result.forEach(res => {
                  roleArray.push(...res.roles);
                });
                oRoleMgm.getByList(roleArray)
                  .then((role_result: any) => {
                    result.forEach(element => {
                      let roles = [];
                      let permissions = [];
                      let permission_array = [];
                      roles = [
                        ...role_result.filter(rol =>
                          element.roles.includes(rol.id)
                        )
                      ];
                      element.dataValues.roles = roles;
                    });
                    let userIds = [
                      ...new Set(
                        result.map(res => res.userId)
                      )
                    ];
                    _usersMgm.find({
                      where: {
                        id: {
                          [Op.in]: userIds
                        }
                      },
                      include: [
                        {
                          model: DataAccess.Models["profiles"],
                          as: "individualProfile"
                        }
                      ]
                    }).then((user_result: any) => {
                      resolve(user_result.map(usr => {
                        const roles = result.find(usp => usp.userId == usr.id).roles;
                        return {
                          firstName: usr.individualProfile.firstName,
                          lastName: usr.individualProfile.lastName,
                          avatar: usr.individualProfile.basicInfo.avatar,
                          mobile: usr.individualProfile.basicInfo.mobile,
                          email: usr.individualProfile.email,
                          department: result.some(usp => usp.userId == usr.id && usp.departmentId) ? result.find(usp => usp.userId == usr.id && usp.departmentId).profileDepartment.name : null,
                          role: roles[0] ? roles[0].name : {}
                        }
                        // comment by navid for debug
                        // return {
                        //   firstName: usr.individualProfile.firstName,
                        //   lastName: usr.individualProfile.lastName,
                        //   avatar: usr.individualProfile.basicInfo.avatar,
                        //   mobile: usr.individualProfile.basicInfo.mobile,
                        //   email: usr.individualProfile.email,
                        //   department: result.some(usp => usp.userId == usr.id && usp.departmentId) ? result.find(usp => usp.userId == usr.id && usp.departmentId).profileDepartment.name : null,
                        //    role: result.find(usp => usp.userId == usr.id).roles[0].name
                        // }
                      }))
                    }).catch((err) => {
                      console.log("first catch", err)
                      RejectHandler(reject, err)
                    })
                  });
              }).catch((err) => {
                console.log("second catch", err)
                RejectHandler(reject, err)
              })
          }
          else
            resolve([]);
        }).catch((err) => {
          console.log("second third", err)
          RejectHandler(reject, err)
        })
    })
  }
}
Object.seal(UserProfilesManager);
