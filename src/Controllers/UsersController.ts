import { Request, Response, NextFunction } from "express";
import { UsersManager } from "../Logic/Managers/UsersManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { FlatEntityPolicy } from "../Repositories/Utility/FlatEntityPolicy";
import { validationResult } from "express-validator";
import { validate } from "../Repositories/Utility/Validator";
import {
  loginRules,
  addWithProfileRules,
  resetPasswordRules,
  loginAndSignWithGoogleRules,
  changePasswordRules,
  changeSecondPasswordRules,
  searchByPhraseRules,
  getFilterRules,
  blockUserRules,
  addEmployeeRules,
  deleteRules,
} from "../Repositories/Validations/UsersValidate";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";

export class UsersController extends BaseRouter {
  constructor() {
    super(UsersManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy(); // let flatEntityPolicy = new FlatEntityPolicy();
    // let validationPolicy = new ValidationPolicy();
    // flatEntityPolicy = {
    //   get: ["password"],
    //   getById: [""],
    //   insert: [""],
    //   update: [""],
    //   delete: [""]
    // }
    permissionPoilicy = {
      get: ["usersget"],
      getById: ["usersget"],
      insert: ["backendapi"],
      update: ["backendapi"],
      delete: ["backendapi"],
    };
    // super.init(permissionPoilicy, validationPolicy, flatEntityPolicy);
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.post(
      "/all/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(true),
      validate,
      this.getByPagingWithFilter
    );
    this.router.post(
      "/profile_all/:profileId/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(true),
      validate,
      this.getByProfilePagingWithFilter
    );
    this.router.post(
      "/profile",
      Permission.permissionRequired(false),
      addWithProfileRules,
      validate,
      this.addWithProfile
    );
    this.router.post(
      "/login",
      Permission.permissionRequired(false),
      loginRules,
      validate,
      this.login
    );
    this.router.get(
      "/id_business/:id/:profileId",
      Permission.permissionRequired(["getprofileemployee"]),
      this.getOneBusiness
    );
    this.router.get(
      "/email/:email",
      Permission.permissionRequired(false),
      this.getByEmail
    );
    this.router.post(
      "/reset_pass",
      Permission.permissionRequired(false),
      resetPasswordRules,
      validate,
      this.resetPassword
    );
    this.router.post(
      "/google",
      Permission.permissionRequired(false),
      loginAndSignWithGoogleRules,
      validate,
      this.signupOrLoginWithGoogle
    );
    this.router.put(
      "/change_password",
      Permission.permissionRequired(true),
      changePasswordRules,
      validate,
      this.changePassword
    );
    this.router.get("/me", Permission.permissionRequired(true), this.getMe);
    this.router.put("/me", Permission.permissionRequired(true), this.updateMe);
    this.router.post(
      "/employee",
      Permission.permissionRequired(["getprofileemployee"]),
      addEmployeeRules,
      validate,
      this.addEmployee
    );
    this.router.post(
      "/employee/:profileId/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["getprofileemployee"]),
      searchByPhraseRules,
      validate,
      this.getEmployee
    );
    this.router.put(
      "/block",
      Permission.permissionRequired(["usersedit"]),
      blockUserRules,
      validate,
      this.blockUser
    );
    this.router.post(
      "/list",
      Permission.permissionRequired(false),
      this.getByList
    );
    this.router.get(
      "/individual_profile/:profileId",
      Permission.permissionRequired(["internalapi"]),
      this.getByIndividualProfileId
    );
    this.router.put(
      "/change_second_password",
      Permission.permissionRequired(true),
      changeSecondPasswordRules,
      validate,
      this.changeSecondPassword
    );
  }

  getByPagingWithFilter = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByPaging(
        req.params.pageNumber,
        req.params.itemsPerPage,
        req.body.phrase,
        req.body.sort
      )
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  getByProfilePagingWithFilter = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.manager
      .getByProfilePaging(
        req.params.pageNumber,
        req.params.itemsPerPage,
        req.body.phrase,
        req.body.sort,
        parseInt(req.params.profileId)
      )
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  getOneBusiness = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .findOneWithIncludes(req.params.id, req.params.profileId)
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => ResponseHandler(res, null, err));
  };

  getAll = (that: any, req: Request, res: Response, next: NextFunction) => {
    this.manager
      .findAllWithIncludes()
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  addWithProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .createWithProfile(req.body)
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  login = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .login(req.body.userName, req.body.password)
      .then((result) => this.manager.setJWTCookie(res, null, result))
      .catch((err) => this.manager.setJWTCookie(res, err, null));
  };

  getByEmail = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .findByEmail(req.params.email)
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  resetPassword = (req: Request, res: Response, next: NextFunction) => {
    var that = this;
    this.manager
      .resetPassword(req.body.guid, req.body.hash, req.body.password)
      .then((result) => {
        that.manager.setJWTCookie(res, null, result);
      })
      .catch((err) => {
        that.manager.setJWTCookie(res, err, null);
      });
  };

  signupOrLoginWithGoogle = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.manager
      .signupOrLoginWithGoogle(req.body)
      .then((result) => this.manager.setJWTCookie(res, null, result))
      .catch((err) => this.manager.setJWTCookie(res, err, null));
  };

  changePassword = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .changePassword(req.body.oldPassword, req.body.password, req["user"])
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => ResponseHandler(res, null, err));
  };

  getMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getMe(req["user"])
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  updateMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .updateMe(req.body, req["user"])
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  addEmployee = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .createEmployee(req.body, req["user"])
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => ResponseHandler(res, null, err));
  };

  getEmployee = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByProfileId(
        req.body.phrase,
        req.body.departmentId,
        req.body.roleId,
        req.params.profileId,
        req.params.pageNumber,
        req.params.itemsPerPage,
        req["user"]
      )
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => ResponseHandler(res, null, err));
  };

  blockUser = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .blockUser(req.body)
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  getByList = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .getByList(req.body.userIds)
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  getByIndividualProfileId = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    this.manager
      .getByIndividualProfileId(req.params.profileId)
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => {
        ResponseHandler(res, null, err);
      });
  };

  changeSecondPassword = (req: Request, res: Response, next: NextFunction) => {
    this.manager
      .changeSecondPassword(
        req.body.oldPassword,
        req.body.secondPassword,
        req["user"].userId
      )
      .then((result) => ResponseHandler(res, result, null))
      .catch((err) => ResponseHandler(res, null, err));
  };
}
const userController = new UsersController();

export default userController.router;
