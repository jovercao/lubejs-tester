import { Entity, EntityKey } from "lubejs";
import { Organization } from "./orgnaization";
import { Position } from "./position";
import { User } from "./user";
export declare class Employee extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    description?: string;
    organization?: Organization;
    positions?: Position[];
    userId?: bigint;
    user?: User;
}
