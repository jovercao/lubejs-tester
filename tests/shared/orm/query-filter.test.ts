import assert from 'assert';
import { DB, Position } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Queryable.filter (orm sample)', function () {
  this.timeout(0);
  let db: DB;
  let positionIds: bigint[];
  before(async () => {
    db = await connectToEmptyDbContext();
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

  it('[P0] filter by name eq', async () => {
    const found = await db.Position.query()
      .filter(p => p.name.eq('1. @'))
      .fetchFirst();
    assert.strictEqual(found?.name, '1. @');
  });

  it('[P0] filter + sort + fetchAll', async () => {
    const list = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .fetchAll();
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].name, '1. @');
    assert.strictEqual(list[2].name, '3. Boss');
  });
});
