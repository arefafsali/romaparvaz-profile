import { Request, Response, NextFunction } from "express";
import { ProfileCommissionsManager } from "../Logic/Managers/ProfileCommissionsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
export class ProfileCommissionsController extends BaseRouter {
  manager: ProfileCommissionsManager;
  constructor() {
    super(ProfileCommissionsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy = {
      get: ["profilecommissionsget"],
      getById: ["profilecommissionsget"],
      insert: ["profilecommissionsedit"],
      update: ["profilecommissionsedit"],
      delete: ["profilecommissionsedit"]
    }
    super.init(permissionPoilicy);
    this.router.get("/profile/:profileId/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByProfileId);
    this.router.get("/unassigned_rules/:profileId", Permission.permissionRequired(false), this.getUnassignedRules);
    this.router.put("/bulk", Permission.permissionRequired(["editairlinequota"]), this.bulkUpdate);
    this.router.post("/bulk/:profileId", Permission.permissionRequired(true), this.bulkCreate);
    this.router.get("/airline/:profileId/:pageNumber/:itemsPerPage", Permission.permissionRequired(["editairlinequota"]), this.getByAirline);
    this.router.get("/rule_profile/:profileId", Permission.permissionRequired(false), this.getByCommissionCodeAndProfileId);
    this.router.post("/commission", Permission.permissionRequired(false), this.insertByProfileIdAndCommission);
    this.router.post("/markup", Permission.permissionRequired(false), this.insertByCommissionOrMarkup);
    this.router.post("/calculate_markup_commission_point", Permission.permissionRequired(false), this.calculateMarkupAndCommissionAndPoint);
    this.router.post("/markup_owner", Permission.permissionRequired(false), this.insertByCommissionOrMarkupForMain);
    this.router.get("/gateway_profile/:gateway_id/:profile_id", Permission.permissionRequired(["profilecommissionsget"]), this.getByGatewayProfile);
    this.router.post("/gateway_airline", Permission.permissionRequired(false), this.getByGatewayAirline);
    this.router.delete("/delete_airline", Permission.permissionRequired(["profilecommissionsedit"]), this.deleteAirline);
    this.router.get("/commission/:profileId", Permission.permissionRequired(false), this.getCommissionByProfileId);
    this.router.get("/gateway_profileType/:gateway_id/:profile_type_id/:profile_grade_id/:pageNumber/:itemsPerPage", Permission.permissionRequired(["profilecommissionsget"]), this.getByGatewayId)
  }

  getByGatewayProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGatewayProfile(req.params.gateway_id, req.params.profile_id, req.query.includeAirlines)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByGatewayAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGatewayAirlines(req.body.gatewayId, req.body.airlines, req.body.profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  deleteAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.deleteAirline(req.body.airlineCode, req.body.gatewayId, req.body.profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(req.params.profileId, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getCommissionByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getCommissionByProfileId(req.params.profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByCommissionCodeAndProfileId = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.manager.getByCommissionCodeAndProfileId(
      req.params.profileId).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  bulkUpdate = (req: Request, res: Response, next: NextFunction) => {
    this.manager.bulkUpdate(req.body).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  bulkCreate = (req: Request, res: Response, next: NextFunction) => {
    this.manager.bulkCreate(req.body, req.params.profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getUnassignedRules = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getUnassignedRules(req.params.profileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByAirline = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByAirline(
      req.params.profileId,
      req.params.pageNumber,
      req.params.itemsPerPage
    ).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
  insertByProfileIdAndCommission = (req: Request, res: Response, next: NextFunction) => {
    this.manager.insertByProfileIdAndCommission(req.body).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
  insertByCommissionOrMarkup = (req: Request, res: Response, next: NextFunction) => {
    this.manager.insertByCommissionOrMarkup(req.body).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
  calculateMarkupAndCommissionAndPoint = (req: Request, res: Response, next: NextFunction) => {
    this.manager.calculateMarkupAndCommissionAndPoint(req.body).then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err))
  }
  insertByCommissionOrMarkupForMain = (req: Request, res: Response, next: NextFunction) => {
    this.manager.insertByCommissionOrMarkup(req.body, true).then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByGatewayId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByGatewayId(req.params.gateway_id, parseInt(req.params.profile_type_id), parseInt(req.params.profile_grade_id), req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const profileCommissions = new ProfileCommissionsController();

export default profileCommissions.router;
