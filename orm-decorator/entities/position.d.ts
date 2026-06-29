import { Entity, EntityKey } from "lubejs";
import { Employee } from "./employee";
export declare class Position extends Entity implements EntityKey {
    id?: bigint;
    name: string;
    description?: string;
    employees?: Employee[];
}
