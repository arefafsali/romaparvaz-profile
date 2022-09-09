export interface IWrite<T> {
  create: (item: T) => any;
  update: (item: T) => any;
  delete: (_id: any) => any;
  createBatch: (item: T[]) => any;
  updateBatch: (item: T[]) => any;
  deleteBatch: (_id: any[]) => any;
}
