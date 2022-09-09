export interface IUnitOfWork<T> {
  getOne: (tableName: string, _id: any, aggregates?: any) => any;
  getList: (tableName: string, query: any, aggregates?: any) => any;
  getListAndCountAll: (tableName: string, query: any, aggregates?: any) => any;
  getListAsync: (tableName: string, query: any, aggregates?: any) => any;
  grabInsert: (tableName: string, entity: T) => any;
  batchInsert: (tableName: string, entity: T[]) => any;
  grabUpdate: (tableName: string, entity: T[]) => any;
  grabDelete: (tableName: string, id: any) => any;
  batchDelete: (tableName: string, id: any[]) => any;
  markNew: (tableName: string, entity: T[], queryNumber?: string) => string;
  markDirty: (tableName: string, entity: T[], queryNumber?: string) => string;
  markDeleted: (tableName: string, entity: T[], queryNumber?: string) => string;
  markList: (tableName: string, query: any, queryNumber?: string) => string;
  commit: (tableName: string, queryNumber: string) => any;
  commitAsync: (tableName: string, queryNumber: string) => any;
  rollback: (tableName: string, queryNumber: string) => any;
}
