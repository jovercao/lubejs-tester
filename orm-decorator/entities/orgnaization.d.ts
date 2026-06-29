import { Entity, EntityKey } from "lubejs";
import { Employee } from "./employee";
export declare class Organization extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    description?: string;
    parentId?: bigint;
    parent?: Organization;
    children?: Organization[];
    employees?: Employee[];
}
