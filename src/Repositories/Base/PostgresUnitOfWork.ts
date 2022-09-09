import { IUnitOfWork } from "../Contracts/IUnitOfWork";
import { injectable } from "inversify";
import { ExternalRequest } from "../../Infrastructure/ExternalRequests";
import DataAccess = require("./DataAccess");

@injectable()
export class PostgresUnitOfWork<T> implements IUnitOfWork<T> {
  public _collection: any;

  constructor() {
    this._collection = DataAccess.Models;
  }

  getOne(tableName: string, _id: any) {
    return new Promise((resolve, reject) => {
      this._collection[tableName]
        .findAll({ where: { id: _id } })
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  getList(tableName: string, query: any) {
    return new Promise((resolve, reject) => {
      this._collection[tableName]
        .findAll(query)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  getListAndCountAll(tableName: string, query: any, aggregates?: any) {
    return new Promise((resolve, reject) => {
      this._collection[tableName]
        .findAndCountAll(query)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  getListAsync(tableName: string, query: any) {
    return new Promise((resolve, reject) => {
      this._collection[tableName]
        .findAll(query)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  grabInsert(tableName: string, entity: T) {
    return new Promise((resolve, reject) => {
      delete entity["guid"];
      this._collection[tableName]
        .create(entity)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  batchInsert(tableName: string, entity: T[]) {
    return new Promise((resolve, reject) => {
      entity.forEach(x => {
        delete x["guid"];
      });
      this._collection[tableName]
        .bulkCreate(entity, { individualHooks: true })
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  grabUpdate(tableName: string, entity: T[]) {
    return new Promise((resolve, reject) => {
      let update_arr = [];
      entity.forEach((val, index) => {
        var id = val["id"];
        delete val["id"];
        update_arr.push(this._collection[tableName]
          .update(val, { where: { id: id } }))
      });
      Promise.all(update_arr).then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  grabDelete(tableName: string, id: any) {
    return new Promise((resolve, reject) => {
      this._collection[tableName]
        .destroy({ where: { id: id } })
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }
  batchDelete(tableName: string, ids: any[]) {
    return new Promise((resolve, reject) => {
      this._collection[tableName]
        .destroy({ where: { id: ids } })
        .then(result => resolve(result))
        .catch(error => reject(error));
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
