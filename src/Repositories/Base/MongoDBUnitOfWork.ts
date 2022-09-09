import { IUnitOfWork } from "../Contracts/IUnitOfWork";
import { injectable } from "inversify";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import DataAccess = require("./DataAccess");
var ObjectId = require("mongodb").ObjectID;
@injectable()
export class MongoDBUnitOfWork<T> implements IUnitOfWork<T> {
  public _collection: any;

  constructor() {
    if (DataAccess.ModelInstance) this._collection = DataAccess.ModelInstance;
    else
      DataAccess.test().then(modelInstance => {
        this._collection = modelInstance;
      });
  }
  getOne(tableName: string, _id: any) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        collection.findOne({ _id: ObjectId(_id) }, (err, result) => {
          if (!err) resolve(result);
          else reject(err);
        });
      });
    });
  }
  getList(tableName: string, query: any, aggregates?: any) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        if (!aggregates) aggregates = [];
        collection
          .aggregate([{ $match: query }, ...aggregates])
          .toArray((err, result) => {
            if (!err) resolve(result);
            else reject(err);
          });
      });
    });
  }
  getListAndCountAll(tableName: string, query: any, aggregates?: any) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        if (!aggregates) aggregates = [];

        collection
          .aggregate([{ $match: query }, { $count: "totalCount" }])
          .toArray((total_err, total_result) => {
            if (!total_err) {
              aggregates.push({
                $addFields: {
                  totalCount:
                    total_result[0] && total_result[0].totalCount
                      ? total_result[0].totalCount
                      : 0
                }
              });
              collection
                .aggregate([{ $match: query }, ...aggregates])
                .toArray((err, result) => {
                  if (!err) resolve(result);
                  else reject(err);
                });
            } else reject(err);
          });
      });
    });
  }
  getListAsync(tableName: string, query: any, aggregates?: any) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        if (!aggregates) aggregates = [];
        collection
          .aggregate([{ $match: query }, ...aggregates])
          .toArray((err, result) => {
            if (!err) resolve(result);
            else reject(err);
          });
      });
    });
  }
  grabInsert(tableName: string, entity: T) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        collection.insertMany(entity).then((result, err) => {
          if (!err) resolve(result);
          else reject(err);
        });
      });
    });
  }
  batchInsert(tableName: string, entity: T[]) {
    return new Promise((resolve, reject) => {
      entity.forEach(x => {
        delete x["_id"];
      });
      this._collection.collection(tableName, (err, collection) => {
        collection.insertMany(entity).then((result, err) => {
          if (!err) resolve(result);
          else reject(err);
        });
      });
    });
  }
  grabInsertWithTTL(
    tableName: string,
    entity: T[],
    ttl: number,
    callback: (error: any, result: any) => void
  ) {
    return new Promise((resolve, reject) => {
      entity.forEach(x => {
        delete x["_id"];
      });
      this._collection.collection(tableName, (err, collection) => {
        collection.insertMany(entity).then((result, err) => {
          if (!err) resolve(result);
          else reject(err);
        });
      });
    });
  }
  grabUpdate(tableName: string, entity: T[]) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        entity.forEach(function (val, index) {
          let id = (<any>val)["_id"];
          delete (<any>val)["_id"];
          collection
            .updateOne({ _id: ObjectId(id) }, { $set: val })
            .then((result, err) => {
              if (!err) resolve(result);
              else reject(err);
            });
        });
      });
    });
  }
  grabDelete(tableName: string, _id: any) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        collection.deleteMany({ _id: ObjectId(_id) }).then((result, err) => {
          if (!err) resolve(result);
          else reject(err);
        });
      });
    });
  }
  batchDelete(tableName: string, ids: any[]) {
    return new Promise((resolve, reject) => {
      this._collection.collection(tableName, (err, collection) => {
        collection.deleteMany({ _id: ObjectId(ids[0]) }).then((result, err) => {
          if (!err) resolve(result);
          else reject(err);
        });
      });
    });
  }

  markNew(tableName: string, entity: T[], queryNumber?: string): string {
    return "";
  }
  markDirty(tableName: string, entity: T[], queryNumber?: string): string {
    return "";
  }
  markDeleted(tableName: string, entity: T[], queryNumber?: string): string {
    return "";
  }
  markList(tableName: string, query: any, queryNumber?: string): string {
    return "";
  }
  commit(tableName: string, queryNumber: string) { }
  commitAsync(tableName: string, queryNumber: string) { }
  rollback(tableName: string, queryNumber: string) { }
}
