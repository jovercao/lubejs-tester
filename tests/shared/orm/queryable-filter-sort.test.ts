import assert from 'assert';
import { DB, Position } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Queryable.filter + sort [P0]', function () {
  this.timeout(0);
  let db: DB;
  let positionIds: bigint[];

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') this.skip();
  });

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
    const positions = Position.create([
      { name: '3. Boss' },
      { name: '2. Staff' },
      { name: '1. @' },
    ]);
    await db.Position.insert(positions);
    positionIds = positions.map(p => p.id!);
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] filter by name eq + fetchFirst', async () => {
    const found = await db.Position.query()
      .filter(p => p.name.eq('1. @'))
      .fetchFirst();
    assert.strictEqual(found?.name, '1. @');
  });

  it('[P0] sort asc + fetchAll', async () => {
    const list = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .fetchAll();
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].name, '1. @');
    assert.strictEqual(list[1].name, '2. Staff');
    assert.strictEqual(list[2].name, '3. Boss');
  });

  it('[P0] sort desc + fetchAll', async () => {
    const list = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.desc()])
      .fetchAll();
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].name, '3. Boss');
    assert.strictEqual(list[1].name, '2. Staff');
    assert.strictEqual(list[2].name, '1. @');
  });
});
