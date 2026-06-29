import { Entity, EntityKey } from "lubejs";
import { Employee } from "./employee";
/**
 * User实体类
 */
export declare class User extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    password: string;
    description?: string;
    employee?: Employee;
}
