import { Binary, Entity, EntityKey } from 'lubejs';
import { OrderDetail } from './order-detail';
/**
 * Order
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
    /**
     * 订单明细
     */
    details?: OrderDetail[];
}
