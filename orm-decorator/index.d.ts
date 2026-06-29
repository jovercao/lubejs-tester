/*************************试验代码****************************/
import { Organization } from "./entities/orgnaization";
import { Order } from "./entities/order";
import { Position } from "./entities/position";
import { Employee } from "./entities/employee";
import { User } from "./entities/user";
import "./entities/employee-position";
import { DbContext, Repository } from "lubejs";
import "lubejs-mssql";
declare module "lubejs" {
    /**
     * 主键声明接口
     */
    interface EntityKey {
        id?: bigint;
    }
}
export declare class DB extends DbContext {
    Organization: Repository<Organization>;
    Order: Repository<Order>;
    Position: Repository<Position>;
    Employee: Repository<Employee>;
    User: Repository<User>;
}
export * from "./entities/employee";
export * from "./entities/user";
export * from "./entities/order";
export * from "./entities/order-detail";
export * from "./entities/orgnaization";
export * from "./entities/position";
export * from "./entities/employee-position";
