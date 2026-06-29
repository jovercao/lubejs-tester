import { Decimal, Entity, EntityKey } from 'lubejs';
import { Order } from './order';
/**
 * OrderDetail
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
