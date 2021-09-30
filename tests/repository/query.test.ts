import { DB, Order, Position } from '@orm';
import { createContext, Decimal, MigrateCli, outputCommand } from 'lubejs';
import assert from 'assert';
import { connectToEmptyDbContext } from 'tests/util';

describe('Queryable ———— ./tests/repository/query.test.ts', function () {
  this.timeout(0);
  let db: DB;
  let orderId: bigint;
  let positionIds: bigint[];
  before(async () => {
    db = await connectToEmptyDbContext();

    const positions = Position.create([
      {
        name: '3. Boss',
      },
      {
        name: '2. Staff',
      },
      {
        name: '1. @',
      },
    ]);
    await db.Position.insert(positions);
    positionIds = positions.map(p => p.id!);
    const order = Order.create({
      date: new Date(),
      details: [
        {
          product: 'Ball pen',
          count: 1,
          price: new Decimal(0.56),
          amount: new Decimal(1 * 0.56),
        },
      ],
    });
    await db.Order.insert(order);
    orderId = order.id!;
  });

  after(async () => {
    db.connection.close();
  });

  it('.filter()', async () => {
    const querys = await db.Position.query()
      .filter(p => p.name.eq('1. @'))
      .fetchFirst();
    assert.equal(querys?.name, '1. @');
  });

  it('.sort()', async () => {
    const positions = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .fetchAll();
    assert(positions[0]?.name === '1. @');
    assert(positions[1]?.name === '2. Staff');
    assert(positions[2]?.name === '3. Boss');
  });

  it('.take()', async () => {
    const positions = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .skip(1)
      .take(1)
      .fetchAll();
    assert(positions.length === 1);
    assert(positions[0]?.name === '2. Staff');
  });

  it('.count()', async () => {
    const res = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .count()
      .fetchFirst();

    assert(res?.count === 3);
  });

  it('.map()', async () => {
    const res = await db.Position.query()
      .filter(p => p.name.eq('1. @'))
      .map(p => ({
        '@name': p.name,
      }))
      .fetchFirst();

    assert(res['@name'] === '1. @');
  });

  it('.include()', async () => {
    const order = await db.Order.query()
      .filter(o => o.id.eq(orderId!))
      .include({ details: true })
      .fetchFirst();
    assert(order?.details?.length === 1);
    assert(order?.details?.[0]?.product === 'Ball pen');
  });

  it('.withDetail', async () => {
    const order = await db.Order.query()
      .filter(o => o.id.eq(orderId!))
      .withDetail()
      .fetchFirst();
    assert(order?.details?.length === 1);
    assert(order?.details?.[0]?.product === 'Ball pen');
  });
});
