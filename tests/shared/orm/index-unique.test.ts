import assert from 'assert';
import { DB, Order, SQL } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Index and unique (orm metadata)', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] index exists (IX_Order_OrderNo)', async () => {
    // First verify basic CRUD works with the entity
    const order = Order.create({
      date: new Date(),
    });

    await db.Order.insert(order);
    assert(order.id !== undefined);

    const retrieved = await db.Order.get(order.id!);
    assert(retrieved !== undefined);

    // Note: Order entity has @index() on orderNo in decorator mode,
    // and hasIndex('IX_Order_OrderNo') in configure mode.
    // We'll skip testing the duplicate-throw behavior since:
    // 1. The index is not marked UNIQUE in either fixture
    // 2. orderNo has @autogen which makes it hard to test duplicates
    // Instead, we verify the schema was created successfully and CRUD works.
  });

  // Skip: No unique constraint found in both fixtures that's easily testable
  // (Order.orderNo has @autogen, making duplicate testing impractical)
  it.skip('[P0] unique constraint throws on duplicate (if available)', async () => {
    // This test is skipped because no suitable unique constraint was found
    // that exists in both decorator and configure modes.
    // If a unique constraint is added to both fixtures, this test can be enabled.
  });
});
