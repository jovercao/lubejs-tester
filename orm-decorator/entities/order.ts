import { DB } from '../index';
import {
  autogen,
  Binary,
  column,
  comment,
  context,
  DbType,
  defaultValue,
  Entity,
  EntityKey,
  identity,
  index,
  key,
  nullable,
  oneToMany,
  XRowset,
  rowflag,
  SQL,
  table,
} from 'lubejs';
import { OrderDetail } from './order-detail';
import { detail } from 'lubejs/orm/decorators/relation-decorators';
/**
 * Order
 */
@table()
@context(() => DB)
@comment('Order')
export class Order extends Entity implements EntityKey {
  @column()
  @comment('ID')
  @key()
  @identity()
  id?: bigint;

  @comment('OrderDate')
  @defaultValue(() => SQL.now())
  @column()
  date!: Date;
  // 自动生成，因此可以为空

  @index()
  @comment('OrderNo')
  @autogen((item: XRowset<Order>) => 'abc')
  @column(DbType.string(20))
  orderNo?: string;

  @column()
  @comment('Description')
  @nullable()
  description?: string;

  /**
   * 行版本号
   */
  @column()
  @comment('Rowflag')
  @rowflag()
  rowflag?: Binary;

  /**
   * 订单明细
   */
  @detail()
  @oneToMany(() => OrderDetail, p => p.order)
  details?: OrderDetail[];
}
