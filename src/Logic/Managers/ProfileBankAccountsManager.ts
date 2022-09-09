import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { profileBankAccount } from "../../Common/Metadata/profileBankAccountMetadata";
import DataAccess = require("../../Repositories/Base/DataAccess");
import { RejectHandler } from "../../Repositories/Utility/ActionResult";
import { ExternalRequest, RequestTemplate } from "../../Infrastructure/ExternalRequests";
export class ProfileBankAccountsManager extends BaseRepository<profileBankAccount> {
  constructor() {
    super("profileBankAccounts");
  }

  getByProfileId(profileId: number) {
    this.referrerOption = {
      user: null,
      apiName: "getByProfileId",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: { profileId }
      })
        .then(result => resolve(result))
        .catch(err =>
          RejectHandler(reject, err));
    });
  }

  getByMe(loggedInUser: any,
    page_number: number,
    items_per_page: number,) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "getByMe",
      apiType: "GET"
    }
    return new Promise((resolve, reject) => {
      this.findAndCountAll({
        where: { profileId: loggedInUser.profileId },
        offset:
          parseInt(page_number.toString()) *
          parseInt(items_per_page.toString()),
        limit: parseInt(items_per_page.toString()),
      })
        .then((result: any) => {
          let _generalIds = [
            ...result.rows
              .filter(res => res.bankAccountTypeId)
              .map(res => res.bankAccountTypeId)
          ];
          let _countryCodes = [
            ...result.rows
              .filter(res => res.countryId)
              .map(res => res.countryId)
          ];
          let request_templates = [];
          request_templates.push(
            new RequestTemplate(
              process.env.MAIN_URL + "general_item/list",
              _generalIds,
              "POST"
            )
          );
          request_templates.push(
            new RequestTemplate(
              process.env.MAIN_URL + "country/list",
              _countryCodes,
              "POST"
            )
          );
          ExternalRequest.callMultipleRequest(
            request_templates).then((req_result: any) => {
              result.rows.forEach(element => {
                element["dataValues"].bankAccountType =
                  req_result[0].payload.data &&
                    req_result[0].payload.data.some(
                      gni => gni._id == element.bankAccountTypeId
                    )
                    ? req_result[0].payload.data.filter(
                      gni => gni._id == element.bankAccountTypeId
                    )[0]
                    : null;
                element["dataValues"].country =
                  req_result[1].payload.data &&
                    req_result[1].payload.data.some(
                      con => con.code == element.countryId
                    )
                    ? req_result[1].payload.data.filter(
                      con => con.code == element.countryId
                    )[0]
                    : null
              })
              resolve(result);
            }).catch(err => {
              console.log(err); RejectHandler(reject, err)
            });
        })
        .catch(err => {
          console.log(err); RejectHandler(reject, err)
        });
    });
  }

  createMe(item: profileBankAccount, loggedInUser: any) {
    this.referrerOption = {
      user: loggedInUser,
      apiName: "createMe",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      item.profileId = loggedInUser.profileId;
      if (item.isDefault)
        this.find({ where: { profileId: item.profileId } }).then((result: any) => {
          result = result.map(res => {
            let final_res = res["dataValues"];
            final_res.isDefault = false;
            return final_res;
          })
          this.updateBatch(result).then(res => {
            this.createOrUpdate(item).then(result => resolve(result)).catch(err =>
              RejectHandler(reject, err));
          }).catch(err =>
            RejectHandler(reject, err));
        }).catch(err =>
          RejectHandler(reject, err));
      else
        this.createOrUpdate(item).then(result => resolve(result)).catch(err =>
          RejectHandler(reject, err));
    });
  }

  createOrUpdate(item: profileBankAccount) {
    this.referrerOption = {
      user: null,
      apiName: "createOrUpdate",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      if (item.id == 0)
        this.create(item).then(result => resolve(result)).catch(err =>
          RejectHandler(reject, err));
      else
        this.update(item).then(result => resolve(result)).catch(err =>
          RejectHandler(reject, err));
    });
  }
}
Object.seal(ProfileBankAccountsManager);
