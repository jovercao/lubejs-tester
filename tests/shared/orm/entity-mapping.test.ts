import assert from 'assert';
import { DB, User } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Entity mapping (orm metadata)', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] entity-to-table round-trip', async () => {
    const user = User.create({
      name: 'test-user',
      password: 'test-pass',
      description: 'test-description',
    });

    await db.User.insert(user);
    assert(user.id !== undefined, 'User id should be assigned');

    const retrieved = await db.User.get(user.id!);
    assert(retrieved !== undefined, 'User should be retrievable');
    assert.strictEqual(retrieved.name, user.name);
    assert.strictEqual(retrieved.password, user.password);
    assert.strictEqual(retrieved.description, user.description);
  });
});
