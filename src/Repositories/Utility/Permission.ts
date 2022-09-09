import { Router, Response, NextFunction, Request } from "express";
import * as jwt from "jsonwebtoken";
import { JWTsManager } from "../../Logic/Managers/JWTsManager";
import { UserProfilesManager } from "../../Logic/Managers/UserProfilesManager";
var ExpressBrute = require("express-brute"),
  //   MemcacheStore = require("express-brute-memcached"),
  store;

store = new ExpressBrute.MemoryStore();

export class Permission {
  static getAuth(req: Request, res: Response, next: NextFunction) {
    // console.log('token',req.cookies.token)
    next();
    // console.log(req.method);
    // res.status(403).send({error: 'access denied'});
  }

  static loginRequired(req: Request, res: Response, next: NextFunction) {
    if (req.cookies.token)
      jwt.verify(
        req.cookies.token,
        process.env.JWT_SECRET,
        {
          algorithms: ["HS384"],
          issuer: "rota"
        },
        function (err, result) {
          if (!err) {
            let jwt_mgm = new JWTsManager();
            jwt_mgm.find(
              {
                where: {
                  guid: result["jti"]
                }
              }).then((jwt_result: any) => {
                // console.log("jwtres",!err && res.length == 1 && res[0].expireDate > Date.now())
                if (
                  jwt_result.length == 1 &&
                  jwt_result[0].expireDate > Date.now()
                ) {
                  req["user"] = result;
                  // console.log(result);
                  next();
                } else res.status(403).send({ error: "access denied" });
              }).catch((err) => {
                res.status(403).send({ error: "access denied" });
              });
          } else res.status(403).send({ error: "access denied" });
        }
      );
    else res.status(403).send({ error: "access denied" });
  }

  static permissionRequired(permissions?: boolean | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!permissions)
        next();
      else if (req.cookies.token) {
        jwt.verify(req.cookies.token, process.env.JWT_SECRET,
          {
            algorithms: ["HS384"],
            issuer: "rota"
          }, (err, result) => {
            if (!err) {
              let jwt_mgm = new JWTsManager();
              jwt_mgm.find({ where: { guid: result["jti"] } })
                .then((jwt_result: any) => {
                  if (jwt_result.length == 1 && jwt_result[0].expireDate > Date.now()) {
                    req["user"] = result;
                    if (typeof permissions == "boolean" || (Array.isArray(permissions) && permissions.length == 0))
                      next();
                    else if (req.headers.internalauth && req.headers.internalauth == process.env.INTERNAL_SECRET)
                      next();
                    else {
                      new UserProfilesManager().checkPermissionList(req["user"], permissions)
                        .then(result => {
                          if (result)
                            next();
                          else
                            res.status(403).send({ error: "access denied" });
                        })
                        .catch(err => { console.log(err); res.status(403).send({ error: "access denied" }) })
                    }
                  } else
                    res.status(403).send({ error: "access denied" });
                })
                .catch(err => res.status(403).send({ error: "access denied" }))
            }
            else
              res.status(403).send({ error: "access denied" });
          })
      }
      else if (req.headers.internalauth && req.headers.internalauth == process.env.INTERNAL_SECRET) {
        next();
      }
      else
        res.status(403).send({ error: "access denied" });
    }
  }

  static bruteFailCallback(
    req: Request,
    res: Response,
    next: NextFunction,
    nextValidRequestDate: Date
  ) {
    res.status(429).send("too many request from your ip!");
  }

  static bruteHandleStateError(error: any) {
    console.log("error");
  }
  static getGlobalBruteForce = new ExpressBrute(store, {
    freeRetries: 100,
    attachResetToRequest: false,
    refreshTimeoutOnRequest: false,
    minWait: 3000,
    maxWait: 30000,
    lifetime: 60 * 60, // 1 Hour (seconds not milliseconds)
    failCallback: Permission.bruteFailCallback,
    handleStoreError: Permission.bruteHandleStateError
  });
}
