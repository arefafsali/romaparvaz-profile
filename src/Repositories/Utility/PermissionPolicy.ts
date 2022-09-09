export class PermissionPolicy {
  constructor() {
  }
  public get: boolean | string[] = false;
  public getById: boolean | string[] = false;
  public insert: boolean | string[] = false;
  public update: boolean | string[] = false;
  public delete: boolean | string[] = false;
}
