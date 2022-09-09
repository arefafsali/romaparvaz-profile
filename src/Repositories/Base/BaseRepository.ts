// Interfaces
import { IRead } from "../Contracts/IRead";
import { IWrite } from "../Contracts/IWrite";
import { IUnitOfWork } from "../Contracts/IUnitOfWork";
import { myContainer } from "../../App_Start/Inversify.Config";
import { insertLog } from "../Utility/Logger"
export abstract class BaseRepository<T> implements IWrite<T>, IRead<T> {
  public repository: IUnitOfWork<T>;
  public entity: string;
  public referrerOption: any = {
    user: null,
    apiName: null,
    apiType: null
  };
  constructor(entity: string) {
    this.repository = myContainer.get<IUnitOfWork<T>>("IUnitOfWork");
    this.entity = entity;
  }

  create(item: T) {
    return new Promise((resolve, reject) => {
      this.repository
        .grabInsert(this.entity, item)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "create", {}, result, item, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "create", {}, error, item, "error", this.referrerOption)
        });
    });
  }

  update(item: T) {
    return new Promise((resolve, reject) => {
      this.repository
        .grabUpdate(this.entity, [item])
        .then(result => {
          resolve(result)
          insertLog(this.entity, "update", {}, result, item, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "update", {}, error, item, "error", this.referrerOption)
        });
    });
  }

  delete(_id: any) {
    return new Promise((resolve, reject) => {
      this.repository
        .grabDelete(this.entity, _id)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "delete", {}, result, _id, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "delete", {}, error, _id, "error", this.referrerOption)
        });
    });
  }

  createBatch(item: T[]) {
    return new Promise((resolve, reject) => {
      this.repository
        .batchInsert(this.entity, item)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "createBatch", {}, result, item, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "createBatch", {}, error, item, "error", this.referrerOption)
        }
        );
    });
  }

  updateBatch(item: T[]) {
    return new Promise((resolve, reject) => {
      this.repository
        .grabUpdate(this.entity, item)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "updateBatch", {}, result, item, "success", this.referrerOption)
        }
        )
        .catch(error => {
          reject(error)
          insertLog(this.entity, "updateBatch", {}, error, item, "error", this.referrerOption)
        }
        );
    });
  }

  deleteBatch(_id: any[]) {
    return new Promise((resolve, reject) => {
      this.repository
        .batchDelete(this.entity, _id)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "deleteBatch", {}, result, _id, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "deleteBatch", {}, error, _id, "error", this.referrerOption)
        });
    });
  }

  find(query: any, aggregates?: any) {
    return new Promise<T[]>((resolve, reject) => {
      this.repository
        .getList(this.entity, query, aggregates)
        .then(result => {
          resolve(result);
          insertLog(this.entity, "find", {}, null, query, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "find", {}, error, query, "error", this.referrerOption)
        }
        );
    });
  }

  findAndCountAll(query: any, aggregates?: any) {
    return new Promise((resolve, reject) => {
      this.repository
        .getListAndCountAll(this.entity, query, aggregates)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "findAndCountAll", {}, null, query, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "findAndCountAll", {}, error, query, "error", this.referrerOption)
        });
    });
  }

  findOne(_id: any) {
    return new Promise((resolve, reject) => {
      this.repository
        .getOne(this.entity, _id)
        .then(result => {
          resolve(result)
          insertLog(this.entity, "findOne", {}, null, _id, "success", this.referrerOption)
        })
        .catch(error => {
          reject(error)
          insertLog(this.entity, "findOne", {}, error, _id, "error", this.referrerOption)
        });
    });
  }
}
