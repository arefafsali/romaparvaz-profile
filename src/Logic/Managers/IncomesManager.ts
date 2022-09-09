// import { FlightBookingsManager } from './../../../../etourism_backend_booking/src/Logic/Managers/FlightBookingsManager';
import { BaseRepository } from "../../Repositories/Base/BaseRepository";
import { income } from "../../Common/Metadata/incomeMetadata";
import { pointOfSale } from "../../Common/Metadata/pointOfSaleMetaData";
import { profilePoint } from "../../Common/Metadata/profilePointMetadata";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import { PointOfSalesManager } from "./PointOfSalesManager"
import { ProfilePointsManager } from "./ProfilePointsManager"
import { RejectHandler } from "../../Repositories/Utility/ActionResult"
import { HTTPStatusCode } from "../../Repositories/Utility/HttpStatusCode";
export class IncomesManager extends BaseRepository<income> {
  constructor() {
    super("incomes");
  }
  setCommissionByIncome(id: string) {
    this.referrerOption = {
      user: null,
      apiName: "setCommissionByIncome",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      ExternalRequest.syncGetRequest(
        `${process.env.MAIN_URL}flight_booking/id/${id}`)
        .then((flightBooking_result: any) => {
          if (flightBooking_result.status === 200 && flightBooking_result.payload.data) {
            let { totalPrice, moneyUnit, flights } = flightBooking_result.payload.data, incomeModel = new income();
            incomeModel.amount = totalPrice;
            incomeModel.bookingFlightId = id;
            this.create(incomeModel)
              .then(creation_result => {
                resolve(creation_result)
              })
              .catch(creation_error =>
                RejectHandler(reject, creation_error));

          }
        }).catch(flightBooking_error => RejectHandler(reject, flightBooking_error));
    })
  }

  insertMSPSRecords(item: any) {
    this.referrerOption = {
      user: null,
      apiName: "insertMSPSRecords",
      apiType: "POST"
    }
    return new Promise((resolve, reject) => {
      this.find({
        where: {
          bookingFlightId: item._id
        }
      }).then(income_res => {
        if (income_res && income_res.length == 0) {
          let _profile_points_mgm = new ProfilePointsManager();
          let _point_sales_mgm = new PointOfSalesManager();
          let _income = new income();
          _income.amount = item.totalPrice;
          _income.serviceTypeCode = 1;
          _income.bookingFlightId = item._id;
          this.create(_income).then(income_res => {
            let promise_arr = []
            item.msps.forEach((element: any) => {
              if (element.isPoint) {
                let _profile_point = new profilePoint();
                _profile_point.point = element.value / 1000;
                _profile_point.pointRuleId = null;
                _profile_point.bookingId = item._id;
                _profile_point.pointTypeId = 3;
                _profile_point.profileId = element.profileId;
                promise_arr.push(_profile_points_mgm.create(_profile_point));
              }
              let _msps = new pointOfSale();
              _msps.amount = element.value;
              _msps.incomeId = income_res["dataValues"]["id"];
              _msps.profileId = element.profileId;
              _msps.gatewayId = element.gateway ? element.gateway.id : null;
              promise_arr.push(_point_sales_mgm.create(_msps));
            })

            Promise.all(promise_arr).then(res => {
              resolve(res);
            }).catch(err =>
              RejectHandler(reject, err));
          }).catch(err =>
            RejectHandler(reject, err));
        }
        else RejectHandler(reject, {}, "AlreadyInserted", HTTPStatusCode.Forbidden);
        // reject("AlreadyInserted");
      }).catch(err =>
        RejectHandler(reject, err));
    });
  }

  insertPointTransferWage(profilePointId: number, wageMoney: number) {
    return new Promise((resolve, reject) => {
      let income_: income = {
        id: 0,
        amount: wageMoney,
        bookingFlightId: null,
        serviceTypeCode: 1,
        walletId: null,
        creditExpenseId: null,
        profilePointId: profilePointId
      }
      this.create(income_)
        .then((result: any) => { resolve(result) })
        .catch(err => {
          RejectHandler(reject, err)
        });
    });

  }
}
Object.seal(IncomesManager);
