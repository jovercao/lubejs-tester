import { Entity, EntityKey } from 'lubejs';
import { Position } from './position';
import { Employee } from './employee';
export declare class EmployeePosition extends Entity implements EntityKey {
    id?: bigint;
    positionId: bigint;
    position?: Position;
    employeeId: bigint;
    employee?: Employee;
}
