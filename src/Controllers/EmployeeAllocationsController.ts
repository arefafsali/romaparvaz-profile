import { Request, Response, NextFunction } from "express";
import { EmployeeAllocationsManager } from "../Logic/Managers/EmployeeAllocationsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { Permission } from "../Repositories/Utility/Permission";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { employeeAllocationAddRule, employeeAllocationDeleteRule, employeeAllocationUpdateRule, employeeAllocationGetRule, employeeAllocationClearRule } from "../Repositories/Validations/employeeAllocationValidate";
import { validate } from "../Repositories/Utility/Validator";

export class EmployeeAllocationsController extends BaseRouter {
  manager: EmployeeAllocationsManager;

  constructor() {
    super(EmployeeAllocationsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    permissionPoilicy.get = ["employeeallocationsget"]
    permissionPoilicy.getById = ["employeeallocationsget"]
    permissionPoilicy.insert = ["employeeallocationsadd"]
    permissionPoilicy.update = ["employeeallocationsedit"]
    permissionPoilicy.delete = ["employeeallocationsdelete"]
    let validationPolicy = new ValidationPolicy();
    validationPolicy.insert = employeeAllocationAddRule;
    validationPolicy.update = employeeAllocationUpdateRule;
    validationPolicy.delete = employeeAllocationDeleteRule;
    super.init(permissionPoilicy, validationPolicy);
    // this.router.get("/all/:pageNumber/:itemsPerPage", Permission.permissionRequired(["employeeallocationsget"]), this.getByPaging);
    this.router.get("/profile_allocations/:profileId/:pageNumber/:itemsPerPage", Permission.permissionRequired(["employeeallocationsget"]), this.getByProfileId);
    this.router.get("/profile_allocations_me/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByProfileIdMe);
    this.router.post("/profile_allocations_all/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getByProfileIdAllUser);
    // this.router.get("/recalculate/:profileId", Permission.permissionRequired(["employeeallocationsget"]), this.recalculateCredit);
    // this.router.get("/recalculate_me", Permission.permissionRequired(true), this.recalculateCreditMe);
    // this.router.get("/all_credits_summary/:profileId", Permission.permissionRequired(["employeeallocationsget"]), this.getProfileAllCreditsSummary);
    // this.router.get("/all_credits_summary_me", Permission.permissionRequired(true), this.getProfileAllCreditsSummaryMe);
    this.router.get("/allocation_expenses/:id/:pageNumber/:itemsPerPage", Permission.permissionRequired(true), this.getAllocationExpensesByAllocationId);
    // this.router.get("/active_credits_summary", Permission.permissionRequired(["employeeallocationsget"]), this.getAllActiveCreditsSummary);
    // this.router.get("/expire_credit/:id", Permission.permissionRequired(["creditsexpire"]), this.expireCredit)

    // this.router.post("/active_credits/:pageNumber/:itemsPerPage", employeeAllocationGetRule, validate, Permission.permissionRequired(["employeeallocationsget"]), this.getActiveCredits);
    // this.router.post("/paid_expired_credits/:pageNumber/:itemsPerPage", employeeAllocationGetRule, validate, Permission.permissionRequired(["employeeallocationsget"]), this.getPaidOrExpiredCredits);
    // this.router.post("/clear_expired_credit", employeeAllocationClearRule, validate, Permission.permissionRequired(["creditsclear"]), this.clearCredit)
    // this.router.post("/insert_deactivate_zero_employee_allocation", employeeAllocationAddRule, validate, Permission.permissionRequired(["employeeallocationsget"]), this.createAndDeactivateZeroAllocation)
  }

  add = (manager: EmployeeAllocationsManager, req: Request, res: Response, next: NextFunction) => {
    let item = { ...req.body, userId: req["user"].userId, ownerProfileId: req["user"].activeProfileId };
    manager.create(item)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  update = (manager: EmployeeAllocationsManager, req: Request, res: Response, next: NextFunction) => {
    let item = { ...req.body, userId: req["user"].userId, ownerProfileId: req["user"].activeProfileId };
    manager.update(item, req["user"].activeProfileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  // createAndDeactivateZeroAllocation = (req: Request, res: Response, next: NextFunction) => {
  //   let item = { ...req.body, userId: req["user"].userId, ownerProfileId: req["user"].activeProfileId };
  //   this.manager.createAndDeactivateZeroAllocation(item)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => { console.log(err); ResponseHandler(res, null, err) });
  // }

  // getByPaging = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.getByPaging(req.params.pageNumber, req.params.itemsPerPage)
  // .then(result => ResponseHandler(res, result, null))
  //     .catch(err => {
  //       ResponseHandler(res, null, err)
  //     });
  // };

  getByProfileId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(parseInt(req.params.profileId), req["user"].activeProfileId, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByProfileIdMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(req["user"].profileId, req["user"].activeProfileId, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  getByProfileIdAllUser = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByProfileId(0, req["user"].activeProfileId, req.params.pageNumber, req.params.itemsPerPage, req.body.filter)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => {
        ResponseHandler(res, null, err)
      });
  };

  // recalculateCredit = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.recalculateCredit(parseInt(req.params.profileId))
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // recalculateCreditMe = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.recalculateCredit(req["user"].activeProfileId)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // getProfileAllCreditsSummary = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.getProfileAllCreditsSummary(parseInt(req.params.profileId))
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // getProfileAllCreditsSummaryMe = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.getProfileAllCreditsSummary(req["user"].activeProfileId)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  getAllocationExpensesByAllocationId = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getAllocationExpensesByAllocationId(req["user"].activeProfileId, req.params.id, parseInt(req.params.pageNumber), parseInt(req.params.itemsPerPage))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  // getActiveCredits = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.getActiveCredits(req.body, req.params.pageNumber, req.params.itemsPerPage)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // getPaidOrExpiredCredits = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.getPaidOrExpiredCredits(req.body, req.params.pageNumber, req.params.itemsPerPage)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // getAllActiveCreditsSummary = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.getAllActiveCreditsSummary()
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // clearCredit = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.clearCredit(req.body, req["user"].userId)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }

  // expireCredit = (req: Request, res: Response, next: NextFunction) => {
  //   this.manager.expireCredit(req.params.id)
  //     .then(result => ResponseHandler(res, result, null))
  //     .catch(err => ResponseHandler(res, null, err));
  // }
}
const employeeAllocationsController = new EmployeeAllocationsController();

export default employeeAllocationsController.router;
