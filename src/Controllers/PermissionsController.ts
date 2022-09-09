import { PermissionsManager } from "../Logic/Managers/PermissionsManager";
import { BaseRouter } from "../Repositories/Utility/BaseRouter";
import { PermissionPolicy } from "../Repositories/Utility/PermissionPolicy";
import { deleteRules } from "../Repositories/Validations/BusinessTypeValidate"
import { ValidationPolicy } from "../Repositories/Utility/ValidationPolicy";
export class PermissionsController extends BaseRouter {
  constructor() {
    super(PermissionsManager);
    this.init();
  }

  init() {
    let permissionPoilicy = new PermissionPolicy();
    let validationPolicy = new ValidationPolicy();
    permissionPoilicy = {
      get: false,
      getById: false,
      insert: false,
      update: false,
      delete: false
    }
    validationPolicy.delete = deleteRules;
    super.init(permissionPoilicy, validationPolicy);
  }
}
const permissionsController = new PermissionsController();

export default permissionsController.router;
