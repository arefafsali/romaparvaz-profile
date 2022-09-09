import { Request, Response, NextFunction } from "express";
import { ProfilesManager } from "../Logic/Managers/ProfilesManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { Permission } from "../Repositories/Utility/Permission";
import { ResponseHandler } from "../Repositories/Utility/ActionResult"
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { validationResult, } from "express-validator";
import {
  getByPagingRules, getNewEvaluationRules, searchByPhraseRules, getAssignToMeRules,
  getInProgressAssignToMeRules, getApprovedAssignToMeRules, assignToProfileRules, updateEvaluationResultRules,
  updateGradeRules, updateMeRules, addBusinessProfileRules, changeAvatarRules, updateAcceptInvitationRules,
  updateLogoRules,
  getApprovedProfileHasCreditRules,
  deleteRules
} from "../Repositories/Validations/ProfilesValidate";
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
import { validate } from "../Repositories/Utility/Validator";
export class ProfilesController extends BaseRouter {
  constructor() {
    super(ProfilesManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: ["profilesget"],
      getById: ["profilesget"],
      insert: ["profilesedit"],
      update: ["profilesedit"],
      delete: ["profilesedit"]
    }
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
    this.router.get("/get_all_business_profiles", Permission.permissionRequired(["getallbusinessprofiles"]), this.getAllBuesinessProfiles);
    this.router.post("/create_business", Permission.permissionRequired(["createbusiness"]), addBusinessProfileRules, validate, this.addBusinessProfile);
    this.router.post("/all/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["getallbusinessprofiles"]),
      getByPagingRules, validate, this.getByPaging);
    this.router.post("/all_user/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["getallassignedprofiles"]),
      getByPagingRules, validate, this.getByUserAndPaging);
    this.router.get("/me", Permission.permissionRequired(true), this.getMe);
    this.router.put("/me", Permission.permissionRequired(true), updateMeRules, validate, this.updateMe);
    this.router.put("/logo", Permission.permissionRequired(["changeprofilelogo"]), updateLogoRules, validate, this.updateLogo);
    this.router.post("/new_eval/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["newevalprofiles"]),
      this.getNewEvaluation);
    this.router.post("/search", Permission.permissionRequired(["searchprofile"]), searchByPhraseRules, validate, this.searchByPhrase);
    this.router.post("/assign_to_me/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["assigntomeprofiles"]),
      getAssignToMeRules, validate, this.getAssignToMe);
    this.router.post("/assign_to_me_hold/:pageNumber/:itemsPerPage",
      Permission.permissionRequired(["assigntomeprofiles"]),
      getInProgressAssignToMeRules, validate, this.getInProgressAssignToMe);
    this.router.post("/assign_to_me_approved/:pageNumber/:itemsPerPage", Permission.permissionRequired(["assigntomeprofiles"]), getApprovedAssignToMeRules, validate, this.getApprovedAssignToMe);
    this.router.put("/assign_to_profile", Permission.permissionRequired(["assignprofiletooperator"]), assignToProfileRules, validate, this.updateAssignToOperator);
    this.router.put("/eval_result", Permission.permissionRequired(["evaluateprofile"]), updateEvaluationResultRules, validate, this.updateEvaluationResult);
    this.router.put("/change_avatar", Permission.permissionRequired(true), changeAvatarRules, validate, this.changeAvatar);
    this.router.get("/business/:id", Permission.permissionRequired(true), this.getOneBusiness);
    this.router.get("/invited", Permission.permissionRequired(true), this.getFirstInvitation);
    this.router.put("/invitation", Permission.permissionRequired(["inviteemployee"]), this.updateInvitation);
    this.router.put("/accept_invitation", Permission.permissionRequired(true), updateAcceptInvitationRules, validate, this.updateAcceptInvitation);
    this.router.put("/grade", Permission.permissionRequired(["editprofilegrade"]), updateGradeRules, validate, this.updateGrade);
    this.router.post("/active_profile/:id", Permission.permissionRequired(true), this.setActiveProfile);
    this.router.get("/active_profile", Permission.permissionRequired(true), this.getActiveProfile);
    this.router.post("/list", Permission.permissionRequired(false), this.getByList);
    this.router.put("/automation", Permission.permissionRequired(true), this.updateDataByAutomation);
    //Added by Pourdad Daneshmand
    this.router.get("/search/:phrase", Permission.permissionRequired(false), this.search);
    this.router.get("/credit_wallet_point_me", Permission.permissionRequired(true), this.getCreditWalletPointMe)
    this.router.post("/active_business_profiles/:pageNumber/:itemsPerPage", Permission.permissionRequired(["getallbusinessprofiles"]), getByPagingRules, validate, this.getActiveBusinessProfilesByPaging)
    this.router.post("/active_business_profiles_has_credit/:pageNumber/:itemsPerPage", Permission.permissionRequired(["getallbusinessprofiles"]), getApprovedProfileHasCreditRules, validate, this.getActiveBusinessProfilesHasCreditByPaging)
    this.router.get("/:id", Permission.permissionRequired(true), this.getBusinessTypeById);
  }

  //Added By Pourdad Daneshmand
  search = (req: Request, res: Response, next: NextFunction) => {
    this.manager.search(req.params.phrase)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getAllBuesinessProfiles = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getAllBuesinessProfiles()
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getOne = (manager: any, req: Request, res: Response, next: NextFunction) => {
    manager.findOneWithIncludes(req.params.id)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  addBusinessProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager.createWithUser(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  searchByPhrase = (req: Request, res: Response, next: NextFunction) => {
    this.manager.searchByPhrase(req.body.phrase)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findAllWithIncludes(req["user"], false, req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort,)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getByUserAndPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findAllWithIncludes(req["user"], true, req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getOneBusiness = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findOneBusiness(req.params.id, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getMe(req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, err.status, err.errorMessage))
  };

  updateMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateMe(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  updateLogo = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateLogo(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getNewEvaluation = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findNewEvaluations(req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getAssignToMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findAssignToMe(req["user"], null, req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getInProgressAssignToMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findAssignToMe(req["user"], false, req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getApprovedAssignToMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.findAssignToMe(req["user"], true, req.params.pageNumber, req.params.itemsPerPage, req.body.filter, req.body.sort)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  updateAssignToOperator = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateAssignToOperator(req["user"], req.body.profileIds, req.body.operatorId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  updateEvaluationResult = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateEvaluationResult(req.body, req.header("cookie"))
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  changeAvatar = (req: Request, res: Response, next: NextFunction) => {
    this.manager.changeAvatar(req.body.avatar, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getByList = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getByList(req.body.profileIds)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  getFirstInvitation = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getFirstInvitation(req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  updateInvitation = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateInvitation(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  updateAcceptInvitation = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateAcceptInvitation(req.body, req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  updateGrade = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateGrade(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  };

  setActiveProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager.setActiveProfile(req.params.id, req["user"])
      .then(result => this.manager.setJWTCookie(res, result))
      .catch(err => ResponseHandler(res, null, err));
  }

  getActiveProfile = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getActiveProfile(req["user"])
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }

  updateDataByAutomation = (req: Request, res: Response, next: NextFunction) => {
    this.manager.updateDataByAutomation(req.body)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
  getBusinessTypeById = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getBusinessTypeById(req.params.id)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
  getActiveBusinessProfilesByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getActiveBusinessProfilesByPaging(req.body, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
  getActiveBusinessProfilesHasCreditByPaging = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getActiveBusinessProfilesHasCreditByPaging(req.body, req.params.pageNumber, req.params.itemsPerPage)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
  getCreditWalletPointMe = (req: Request, res: Response, next: NextFunction) => {
    this.manager.getCreditWalletPoint(req["user"].activeProfileId)
      .then(result => ResponseHandler(res, result, null))
      .catch(err => ResponseHandler(res, null, err));
  }
}
const profileController = new ProfilesController();

export default profileController.router;
