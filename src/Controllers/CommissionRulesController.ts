import { Request, Response, NextFunction } from "express";
import { CommissionRulesManager } from "../Logic/Managers/CommissionRulesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
export class CommissionRulesController extends BaseRouter {
  manager: CommissionRulesManager;

  constructor() {
    super(CommissionRulesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["commissionrulesget"],
      getById: ["commissionrulesget"],
      insert: ["commissionrulesedit"],
      update: ["commissionrulesedit"],
      delete: ["commissionrulesedit"]
    }
    super.init(permissionPoilicy);
    this.router.get("/gateway_profile/:gateway_id/:profile_type_id/:profile_grade_id", Permission.permissionRequired(["commissionrulesget"]), this.getByGatewayProfile);
    this.router.get("/gateway_profile_type/:gateway_id/:profile_type_id", Permission.permissionRequired(["commissionrulesget"]), this.getByGatewayProfile);
    this.router.post("/gateway_airline", Permission.permissionRequired(false), this.getByGatewayAirline);
    this.router.post("/airline/:pageNumber/:itemsPerPage", Permission.permissionRequired(false), this.getByGateway);
    this.router.delete("/delete_airline", Permission.permissionRequired(["commissionrulesedit"]), this.deleteAirline)
  }

  getByGatewayProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGatewayProfile(req.params.gateway_id, req.params.profile_type_id, req.params.profile_grade_id, req.query.includeAirlines)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByGatewayAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGatewayAirlines(req.body.gatewayId, req.body.airlines, req.body.profileTypeId, req.body.profileGradeId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };



  getByGateway = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGateway(
      req.body.gatewayId,
      req.body.airlines,
      req.params.pageNumber,
      req.params.itemsPerPage,
      req.body.sort,
    )
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  deleteAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.deleteAirline(req.body.airlineCode, req.body.gatewayId, req.body.profileTypeId, req.body.profileGradeId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const commissionRulesController = new CommissionRulesController();

export default commissionRulesController.router;
