import assert from 'assert';
import { DB, Position } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Queryable.skip + take [P0]', function () {
  this.timeout(0);
  let db: DB;
  let positionIds: bigint[];

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') this.skip();
  });

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
    const positions = Position.create([
      { name: '1. First' },
      { name: '2. Second' },
      { name: '3. Third' },
      { name: '4. Fourth' },
    ]);
    await db.Position.insert(positions);
    positionIds = positions.map(p => p.id!);
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] skip(1).take(1) returns 2nd row', async () => {
    const list = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .skip(1)
      .take(1)
      .fetchAll();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].name, '2. Second');
  });

  it('[P0] skip(2).take(2) returns 3rd and 4th rows', async () => {
    const list = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .skip(2)
      .take(2)
      .fetchAll();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].name, '3. Third');
    assert.strictEqual(list[1].name, '4. Fourth');
  });

  it('[P0] take(2) without skip returns first 2 rows', async () => {
    const list = await db.Position.query()
      .filter(p => p.id.in(positionIds))
      .sort(p => [p.name.asc()])
      .take(2)
      .fetchAll();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].name, '1. First');
    assert.strictEqual(list[1].name, '2. Second');
  });
});
