import { Request, Response, NextFunction } from "express";
import { BusinessTypesManager } from "../Logic/Managers/BusinessTypesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { Permission } from "../Repositories/Utility/Permission";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { addRules, updateRules, deleteRules } from "../Repositories/Validations/BusinessTypeValidate"
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
export class BusinessTypesController extends BaseRouter {
  constructor() {
    super(BusinessTypesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: ["businesstypesget"],
      getById: ["businesstypesget"],
      insert: ["businesstypesedit"],
      update: ["businesstypesedit"],
      delete: ["businesstypesedit"]
    }
    validationPolicy.insert = addRules;
    validationPolicy.update = updateRules;
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.get("/all", Permission.permissionRequired(true), this.getAllWithDependency);
    this.router.post("/all/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByPaging);
    this.router.post("/code_list", Permission.permissionRequired(false), this.getByCodeList);
    this.router.post("/list", Permission.permissionRequired(false), this.getByIdList);
  }

  getByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByPaging(
      req.params.pageNumber,
      req.params.itemsPerPage,
      req.body.filter,
      req.body.sort
    ).then(result => ResponseHandler(res, result, null)).catch(err => {
      ResponseHandler(res, null, err)
    });
  };

  getAllWithDependency = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getAllWithDependency()
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByCodeList = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByCodeList(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByIdList = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByIdList(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };
}
const businessTypesController = new BusinessTypesController();

export default businessTypesController.router;
