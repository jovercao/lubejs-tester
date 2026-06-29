import { DbContext, Repository, Entity, EntityKey, Binary, Decimal } from "lubejs";
/*************************试验代码****************************/
declare module "lubejs" {
    /**
     * 主键声明接口
     */
    interface EntityKey {
        id?: bigint;
    }
}
/**
 * 用户实体类
 */
export declare class User extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    password: string;
    description?: string;
    employee?: Employee;
}
/**
 * 订单
 */
export declare class Order extends Entity implements EntityKey {
    id?: bigint;
    date: Date;
    orderNo?: string;
    description?: string;
    /**
     * 行版本号
     */
    rowflag?: Binary;
    details?: OrderDetail[];
}
/**
 * 订单明细
 */
export declare class OrderDetail extends Entity implements EntityKey {
    id?: bigint;
    product: string;
    count: number;
    price: Decimal;
    amount: Decimal;
    description?: string;
    orderId?: bigint;
    order?: Order;
}
export declare class Position extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    description?: string | null;
    employees?: Employee[];
}
export declare class Employee extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    description?: string;
    organization?: Organization;
    positions?: Position[];
    user?: User;
}
export declare class EmployeePosition extends Entity implements EntityKey {
    id?: bigint;
    positionId: bigint;
    position?: Position;
    employeeId: bigint;
    employee?: Employee;
}
export declare class Organization extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    description?: string;
    parentId?: bigint;
    parent?: Organization;
    children?: Organization[];
    employees?: Employee[];
}
export declare class DB extends DbContext {
    get Organization(): Repository<Organization>;
    get Order(): Repository<Order>;
    get Position(): Repository<Position>;
    get Employee(): Repository<Employee>;
    get User(): Repository<User>;
}
