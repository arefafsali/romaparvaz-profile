import { Request, Response, NextFunction } from "express";
import { GatewayCommissionsManager } from "../Logic/Managers/GatewayCommissionsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { Permission } from "../Repositories/Utility/Permission";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
export class GatewayCommissionsController extends BaseRouter {
  manager: GatewayCommissionsManager;

  constructor() {
    super(GatewayCommissionsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["gatewaycommissionsget"],
      getById: ["gatewaycommissionsget"],
      insert: ["gatewaycommissionsedit"],
      update: ["gatewaycommissionsedit"],
      delete: ["gatewaycommissionsedit"]
    }
    super.init(permissionPoilicy);
    this.router.get("/gateway/:gateway_id", Permission.permissionRequired(["gatewaycommissionsget"]), this.getByGateway);
    this.router.post("/gateway_airline", Permission.permissionRequired(false), this.getByGatewayAirline);
    this.router.delete("/delete_airline", Permission.permissionRequired(["gatewaycommissionsedit"]), this.deleteAirline);
    this.router.get("/active_gateways", Permission.permissionRequired(["gatewaycommissionsget"]), this.getActiveGateways);
    this.router.get("/commission_free_airlines/:gateway_id", Permission.permissionRequired(["gatewaycommissionsget"]), this.getCommissionFreeAirlinesByGateway)
    this.router.post("/permissible_gateways", Permission.permissionRequired(false), this.getPermissibleGateways)
  }

  getByGateway = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGateway(req.params.gateway_id, req.query.includeAirlines)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByGatewayAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGatewayAirlines(req.body.gatewayId, req.body.airlines)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  deleteAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.deleteAirline(req.body.airlineCode, req.body.gatewayId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getActiveGateways = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getActiveGateways()
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getCommissionFreeAirlinesByGateway = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getCommissionFreeAirlinesByGateway(req.params.gateway_id)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getPermissibleGateways = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getPermissibleGateways(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const gatewayCommissionsController = new GatewayCommissionsController();

export default gatewayCommissionsController.router;
