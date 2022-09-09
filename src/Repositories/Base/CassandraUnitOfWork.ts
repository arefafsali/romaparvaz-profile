// import { IUnitOfWork } from "../Contracts/IUnitOfWork";
// import { injectable } from "inversify";
// import DataAccess = require("./DataAccess");

// @injectable()
// export class CassandraUnitOfWork<T> implements IUnitOfWork<T> {
//   public _collection: any;

//   constructor() {
//     // var db = new DataAccess();
//     this._collection = DataAccess.ModelInstance;
//   }

//   getList(
//     tableName: string,
//     query: any,
//     callback: (error: any, result: any) => void
//   ) {
//     this._collection.instance[tableName].find(query, { raw: true }, callback);
//   }
//   getListAndCountAll(
//     tableName: string,
//     query: any,
//     callback: (error: any, result: any) => void
//   ) {
//     this._collection.instance[tableName].find(query, { raw: true }, callback);
//   }
//   getListAsync(
//     tableName: string,
//     query: any,
//     callback: (error: any, result: any) => void
//   ) {
//     this._collection.instance[tableName].findAsync(
//       query,
//       { raw: true },
//       callback
//     );
//   }
//   grabInsert(tableName: string, entity: T) {
//     return new Promise((resolve, reject) => {
//       var queries: any = [];
//       var that: any = this;
//       var model = new that._collection.instance[tableName](entity);
//       queries.push(model.save({ return_query: true }));
//       this._collection.doBatch(queries, resolve);
//     });
//   }
//   batchInsert(tableName: string, entity: T[]) {
//     return new Promise((resolve, reject) => {
//       var queries: any = [];
//       var that: any = this;
//       var model = new that._collection.instance[tableName](entity);
//       queries.push(model.save({ return_query: true }));
//       this._collection.doBatch(queries, resolve);
//     });
//   }
//   grabUpdate(tableName: string, entity: T[]) {
//     return new Promise((resolve, reject) => {
//       let queries: any = [];
//       let that: any = this;
//       entity.forEach(function(val, index) {
//         let id = (<any>val)["id"];
//         delete (<any>val)["id"];
//         var model = that._collection.instance[tableName].update(
//           { id: id },
//           val,
//           {
//             return_query: true
//           }
//         );
//         queries.push(model);
//       });
//       this._collection.doBatch(queries, resolve);
//     });
//   }
//   grabDelete(tableName: string, id: any) {
//     return new Promise((resolve, reject) => {
//       let queries: any = [];
//       let that: any = this;
//       id.forEach(function(val, index) {
//         var model = that._collection.instance[tableName].delete(
//           { id: val },
//           {
//             return_query: true
//           }
//         );
//         queries.push(model);
//       });
//       this._collection.doBatch(queries, resolve);
//     });
//   }
//   batchDelete(tableName: string, id: any[]) {
//     return new Promise((resolve, reject) => {
//       let queries: any = [];
//       let that: any = this;
//       id.forEach(function(val, index) {
//         var model = that._collection.instance[tableName].delete(
//           { id: val },
//           {
//             return_query: true
//           }
//         );
//         queries.push(model);
//       });
//       this._collection.doBatch(queries, resolve);
//     });
//   }
//   markNew(tableName: string, entity: T[], queryNumber?: string): string {
//     return "";
//   }
//   markDirty(tableName: string, entity: T[], queryNumber?: string): string {
//     return "";
//   }
//   markDeleted(tableName: string, entity: T[], queryNumber?: string): string {
//     return "";
//   }
//   markList(tableName: string, query: any, queryNumber?: string): string {
//     return "";
//   }
//   commit(tableName: string, queryNumber: string) {}
//   commitAsync(tableName: string, queryNumber: string) {}
//   rollback(tableName: string, queryNumber: string) {}
// }
