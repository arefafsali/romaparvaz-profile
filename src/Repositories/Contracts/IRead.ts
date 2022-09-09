export interface IRead<T> {
  find: (query: any, aggregates?: any) => any;
  findAndCountAll: (query: any, aggregates?: any) => any;
  findOne: (id: string) => any;
}
