import assert from 'assert';
import { DB, Order, OrderDetail } from '@orm';
import { Decimal } from 'lubejs';
import { connectToEmptyDbContext } from '../../util';

describe('ORM: One-to-Many Relation', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] Insert Order with nested OrderDetail children', async () => {
    const order = Order.create({
      date: new Date(),
      description: 'Test order with details',
      details: [
        {
          product: 'Product A',
          count: 2,
          price: new Decimal(100),
          amount: new Decimal(200),
        },
        {
          product: 'Product B',
          count: 3,
          price: new Decimal(50),
          amount: new Decimal(150),
        },
      ],
    });

    await db.Order.insert(order);

    // Assert parent id set
    assert(order.id !== undefined, 'Order id should be set');

    // Assert children ids set
    assert(order.details?.[0]?.id !== undefined, 'First detail id should be set');
    assert(order.details?.[1]?.id !== undefined, 'Second detail id should be set');

    // Assert children orderId matches parent id
    assert.strictEqual(order.details?.[0]?.orderId, order.id, 'First detail orderId should match parent');
    assert.strictEqual(order.details?.[1]?.orderId, order.id, 'Second detail orderId should match parent');
  });

  it('[P0] Eager load Order with details using include', async () => {
    // First create an order with details
    const order = Order.create({
      date: new Date(),
      description: 'Eager load test order',
      details: [
        {
          product: 'Eager Product 1',
          count: 1,
          price: new Decimal(75),
          amount: new Decimal(75),
        },
        {
          product: 'Eager Product 2',
          count: 5,
          price: new Decimal(20),
          amount: new Decimal(100),
        },
      ],
    });

    await db.Order.insert(order);
    const orderId = order.id!;

    // Query back with eager loading
    const fetchedOrder = await db.Order.query()
      .filter(p => p.id.eq(orderId))
      .include({ details: true })
      .fetchFirst();

    assert(fetchedOrder !== undefined, 'Order should be found');
    assert(Array.isArray(fetchedOrder.details), 'Details should be an array');
    assert.strictEqual(fetchedOrder.details?.length, 2, 'Should have 2 details');
  });
});
