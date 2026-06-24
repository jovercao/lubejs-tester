import assert from 'assert';
import { DB, Order, OrderDetail } from '@orm';
import { Decimal } from 'lubejs';
import { connectToEmptyDbContext } from '../../util';

describe('Queryable.include [P0]', function () {
  this.timeout(0);
  let db: DB;
  let orderId: bigint;

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') this.skip();
  });

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
    const order = Order.create({
      date: new Date(),
      details: [
        {
          product: 'Ball pen',
          count: 1,
          price: new Decimal(0.56),
          amount: new Decimal(0.56),
        },
        {
          product: 'Notebook',
          count: 2,
          price: new Decimal(2.99),
          amount: new Decimal(5.98),
        },
      ],
    });
    await db.Order.insert(order);
    orderId = order.id!;
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] include Order.details (one-to-many)', async () => {
    const order = await db.Order.query()
      .filter(o => o.id.eq(orderId))
      .include({ details: true })
      .fetchFirst();
    assert.ok(order);
    assert.strictEqual(order.id, orderId);
    assert.ok(order.details);
    assert.strictEqual(order.details.length, 2);
    assert.strictEqual(order.details[0].product, 'Ball pen');
    assert.strictEqual(order.details[1].product, 'Notebook');
  });
});
