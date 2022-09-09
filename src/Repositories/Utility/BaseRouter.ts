import { Router, Response, NextFunction, Request } from "express";
import { ResponseHandler } from "../Utility/ActionResult"
import { validationResult } from "express-validator";
import { PermissionPolicy } from "./PermissionPolicy";
import { Permission } from "./Permission";
import { validate } from "../Utility/Validator"
import { ValidationPolicy } from "./ValidationPolicy";
import { FlatEntityPolicy } from "./FlatEntityPolicy"
export class BaseRouter {
  router: Router;
  manager: any;
  flatEntity: any;
  constructor(type: any) {
    this.router = Router();
    this.manager = new type();
    this.flatEntity = [];
  }
  init(permissionPolicy: PermissionPolicy = new PermissionPolicy(), validationRule: ValidationPolicy = new ValidationPolicy(), flatEntityPolicy: FlatEntityPolicy = new FlatEntityPolicy()) {
    this.flatEntity = flatEntityPolicy;
    this.router.get("/", Permission.permissionRequired(permissionPolicy.get),
      (req: Request, res: Response, next: NextFunction) => {
        this.getAll(this.manager, req, res, next);
      });
    this.router.get("/id/:id", Permission.permissionRequired(permissionPolicy.getById),
      (req: Request, res: Response, next: NextFunction) => {
        this.getOne(this.manager, req, res, next);
      });
    this.router.post("/", Permission.permissionRequired(permissionPolicy.insert), validationRule.insert, validate,
      (req: Request, res: Response, next: NextFunction) => {
        this.add(this.manager, req, res, next);
      });
    this.router.put("/", Permission.permissionRequired(permissionPolicy.update), validationRule.update, validate,
      (req: Request, res: Response, next: NextFunction) => {
        this.update(this.manager, req, res, next);
      });
    this.router.delete("/", Permission.permissionRequired(permissionPolicy.delete), validationRule.delete, validate,
      (req: Request, res: Response, next: NextFunction) => {
        this.delete(this.manager, req, res, next);
      }
    );
  }

  getAll = (manager: any, req: Request, res: Response, next: NextFunction) => {
    // manager.find({}).then(result => ResponseHandler(res, { result, flatItems: this.flatEntity.get }, null))
    let aggregate = [];
    const { sortKey, sortValue = "asc" } = req.query;
    console.log("sortValue", sortValue)
    if (sortKey)
      aggregate.push({ $sort: { [sortKey]: sortValue === "desc" ? -1 : 1 } })
    console.log("aggregate", aggregate)
    manager.find({}, aggregate).then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getOne = (manager: any, req: Request, res: Response, next: NextFunction) => {
    manager.findOne(req.params.id).then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  add = (manager: any, req: Request, res: Response, next: NextFunction) => {
    manager.create(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  update = (manager: any, req: Request, res: Response, next: NextFunction) => {
    manager.update(req.body).then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  delete = (manager: any, req: Request, res: Response, next: NextFunction) => {
    manager.delete(req.body.id).then(result => ResponseHandler(res, result ? true : false, null))
      .catch(err => ResponseHandler(res, null, err));
  };
}
