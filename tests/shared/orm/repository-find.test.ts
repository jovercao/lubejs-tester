import assert from 'assert';
import { User, DB } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Repository: find (orm)', function () {
  this.timeout(0);
  let db: DB;

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') {
      this.skip();
    }
  });

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });

    // Insert test data
    await db.User.insert([
      User.create({ name: 'findme', password: 'p1', description: 'target user' }),
      User.create({ name: 'other1', password: 'p2' }),
      User.create({ name: 'other2', password: 'p3' }),
    ]);
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] get by primary key returns the entity', async () => {
    // First find the id of the 'findme' user
    const found = await db.User.query()
      .find(p => p.name.eq('findme'))
      .fetchFirst();
    assert(found !== undefined, 'setup: findme user should exist');

    const retrieved = await db.User.get(found.id!);
    assert(retrieved !== undefined);
    assert.strictEqual(retrieved.id, found.id);
    assert.strictEqual(retrieved.name, 'findme');
  });

  it('[P0] find by condition returns matching entity', async () => {
    const found = await db.User.query()
      .find(p => p.name.eq('findme'))
      .fetchFirst();
    assert(found !== undefined);
    assert.strictEqual(found.name, 'findme');
    assert.strictEqual(found.description, 'target user');
  });

  it('[P0] get non-existent key throws', async () => {
    await assert.rejects(async () => await db.User.get(99999999n));
  });

  it('[P0] find no match throws', async () => {
    await assert.rejects(async () => {
      await db.User.query()
        .find(p => p.name.eq('nonexistent'))
        .fetchFirst();
    });
  });
});
