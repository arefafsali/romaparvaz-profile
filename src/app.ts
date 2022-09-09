import * as express from "express";
import * as logger from "morgan";
var cors = require("cors");
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import "reflect-metadata";
import UsersController from "./Controllers/UsersController";
import ProfileController from "./Controllers/ProfilesController";
import RolesController from "./Controllers/RolesController";
import PermissionsController from "./Controllers/PermissionsController";
import BusinessTypesController from "./Controllers/BusinessTypesController";
import UserProfilesController from "./Controllers/UserProfilesController";
import JWTsController from "./Controllers/JWTsController";
import { Permission } from "./Repositories/Utility/Permission";
import ProfileTypesController from "./Controllers/ProfileTypesController";
import ProfileCommissionsController from "./Controllers/ProfileCommissionsController";
import CommissionRulesController from "./Controllers/CommissionRulesController";
import ProfilePointsController from "./Controllers/ProfilePointsController";
import CommissionTypesController from "./Controllers/PointTypesController";
import ProfileGradesController from "./Controllers/ProfileGradesController";
import ProfileDepartmentsController from "./Controllers/ProfileDepartmentsController";
import ServiceTypesController from "./Controllers/ServiceTypesController";
import IncomesController from "./Controllers/IncomesController";
import PointOfSalesController from "./Controllers/PointOfSalesController";
import ProfileBankAccountsController from "./Controllers/ProfileBankAccountsController";
import GatewayCommissionsController from "./Controllers/GatewayCommissionsController";
import WithdrawRequestsController from "./Controllers/WithdrawRequestsController";
import PointRulesController from "./Controllers/PointRulesController";
import MarkupController from "./Controllers/MarkupController";
import CreditController from "./Controllers/CreditController";
import CreditStatusesController from "./Controllers/CreditStatusesController";
import CreditExpensesController from "./Controllers/CreditExpensesController";
import WalletsController from "./Controllers/WalletsController";
import WalletStatusesController from "./Controllers/WalletStatusesController";
import EmployeeAllocationsController from "./Controllers/EmployeeAllocationsController";
export class App {
  // ref to Express instance
  public express: express.Application;

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(logger("dev"));
    this.express.use(cors({ credentials: true }));
    this.express.use(cookieParser());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(Permission.getAuth);
    // this.express.use(
    //   Permission.getGlobalBruteForce.getMiddleware({
    //     key: function(req, res, next) {
    //       // prevent too many attempts for the same username
    //       next(req.url);
    //     }
    //   })
    // );
  }

  // Configure API endpoints.
  private routes(): void {
    let router = express.Router();
    this.express.use("/", router);
    this.express.get("/health", (req, res) => {
      res.send({ "status": "UP" })
    })
    this.express.use("/bank_account", ProfileBankAccountsController);
    this.express.use("/business_type", BusinessTypesController);
    this.express.use("/commission_rule", CommissionRulesController);
    this.express.use("/credit", CreditController);
    this.express.use("/credit_expense", CreditExpensesController);
    this.express.use("/credit_status", CreditStatusesController);
    this.express.use("/employee_allocation", EmployeeAllocationsController);
    this.express.use("/gateway_commission", GatewayCommissionsController);
    this.express.use("/income", IncomesController);
    this.express.use("/jwt", JWTsController);
    this.express.use("/markup", MarkupController);
    this.express.use("/permission", PermissionsController);
    this.express.use("/profile_point", ProfilePointsController);
    this.express.use("/point_of_sale", PointOfSalesController);
    this.express.use("/point_rules", PointRulesController);
    this.express.use("/point_type", CommissionTypesController);
    this.express.use("/profile_commission", ProfileCommissionsController);
    this.express.use("/profile_department", ProfileDepartmentsController);
    this.express.use("/profile_grade", ProfileGradesController);
    this.express.use("/profile", ProfileController);
    this.express.use("/profile_Type", ProfileTypesController);
    this.express.use("/role", RolesController);
    this.express.use("/service_type", ServiceTypesController);
    this.express.use("/user_profile", UserProfilesController);
    this.express.use("/users", UsersController);
    this.express.use("/wallet", WalletsController);
    this.express.use("/wallet_status", WalletStatusesController);
    this.express.use("/withdraw_request", WithdrawRequestsController);

  }
}

export default new App().express;
