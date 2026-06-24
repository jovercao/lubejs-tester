import assert from 'assert';
import { DB, Position, Order, OrderDetail } from '@orm';
import { Decimal, SQL } from 'lubejs';
import { connectToEmptyDbContext } from '../../util';

describe('Queryable.aggregate [P0]', function () {
  this.timeout(0);
  let db: DB;
  let positionIds: bigint[];

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') this.skip();
  });

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
    const positions = Position.create([
      { name: '1. @' },
      { name: '2. Staff' },
      { name: '3. Boss' },
    ]);
    await db.Position.insert(positions);
    positionIds = positions.map(p => p.id!);
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] count() returns {count: N}', async () => {
    const res = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .count()
      .fetchFirst();
    assert.ok(res);
    assert.strictEqual(res.count, 3);
  });

  it('[P0] map with simple projection', async () => {
    const res = await db.Position.query()
      .filter(p => p.name.eq('1. @'))
      .map(p => ({
        theName: p.name,
        theId: p.id,
      }))
      .fetchFirst();
    assert.ok(res);
    assert.strictEqual(res.theName, '1. @');
    assert.ok(res.theId);
  });

  it('[P0] sum() via map returns total', async function () {
    // OrderDetail 没有 @repository 属性,用 getRepository 获取;插入带明细的 Order 后对明细求和。
    const order = Order.create({
      date: new Date(),
      details: [
        { product: 'a', count: 1, price: new Decimal(1.5), amount: new Decimal(1.5) },
        { product: 'b', count: 2, price: new Decimal(2.5), amount: new Decimal(5) },
      ],
    });
    await db.Order.insert(order);
    const repo = db.getRepository(OrderDetail);
    const res = await repo.query()
      .filter(p => p.orderId.eq(order.id!))
      .map(p => ({ total: SQL.sum(p.price) }))
      .fetchFirst();
    assert.ok(res);
    assert.strictEqual(Number(res.total), 4);
  });
});
