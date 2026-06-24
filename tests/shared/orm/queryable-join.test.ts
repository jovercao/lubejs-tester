import assert from 'assert';
import { DB, Order, OrderDetail } from '@orm';
import { Decimal } from 'lubejs';
import { connectToEmptyDbContext } from '../../util';

describe('Queryable.join [P0]', function () {
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

  it('[P0] join Order with OrderDetail and project', async () => {
    const rows = await db.Order.query()
      .join(OrderDetail, (o, od) => o.id.eq(od.orderId), (o, od) => ({
        orderId: o.id,
        product: od.product,
        price: od.price,
      }))
      .fetchAll();
    assert.ok(rows);
    assert.strictEqual(rows.length, 2);

    // Check that both products are present
    const products = rows.map(r => r.product);
    assert.ok(products.includes('Ball pen'));
    assert.ok(products.includes('Notebook'));

    // Check orderId matches (compare as string to avoid bigint vs number issues)
    assert.strictEqual(String(rows[0].orderId), String(orderId));
    assert.strictEqual(String(rows[1].orderId), String(orderId));
  });
});
