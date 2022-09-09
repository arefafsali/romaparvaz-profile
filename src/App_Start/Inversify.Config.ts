import { Container } from "inversify";
import { IUnitOfWork } from "../Repositories/Contracts/IUnitOfWork";
import { PostgresUnitOfWork } from "../Repositories/Base/PostgresUnitOfWork";

const myContainer = new Container();
myContainer.bind<IUnitOfWork<any>>("IUnitOfWork").to(PostgresUnitOfWork);

export { myContainer };
