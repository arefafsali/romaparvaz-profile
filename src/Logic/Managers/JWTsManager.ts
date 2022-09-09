import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { JWT } from "../../Common/Metadata/jwtMetadata";
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
export class JWTsManager extends BaseRepository<JWT> {
  constructor() {
    super("jwts");
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
  signout(loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "signout",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find(
        {
          where: {
            guid: loggedInUser.jti
          }
        }
      ).then(result => {
        this.delete(result[0]["dataValues"].id).then(result => resolve(result))
          .catch(err => RejectHandler(reject, err));
      }).catch(err => RejectHandler(reject, err));
    })
  }

  blockUser(userId: number) {
    this.referrerOption = {
      user: null,
      apiName: "users/block",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({ where: { userId: userId } })
        .then(result => {
          Promise.all(result.map(el => this.delete(el.id)))
            .then(result => resolve(result))
            .catch(err => RejectHandler(reject, err));
        })
        .catch(err => RejectHandler(reject, err));
    })
  }
}
Object.seal(JWTsManager);
