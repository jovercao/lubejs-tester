import assert from 'assert';
import { User, DB } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('DbContext Transaction (orm)', function () {
  this.timeout(0);
  let db: DB;

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') {
      this.skip();
    }
  });

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) {
      await db.connection.close();
    }
  });

  it('[P0] commit persists data', async () => {

    const userName = 'commit-test-user';
    let userId: bigint | undefined;

    await db.connection.beginTrans();
    try {
      const user = User.create({
        name: userName,
        password: '123456',
      });
      await db.User.insert(user);
      userId = user.id!;
      await db.connection.commit();
    } catch (e) {
      await db.connection.rollback();
      throw e;
    }

    // Verify data is present after commit
    const found = await db.User.get(userId!);
    assert(found !== undefined, 'user should be found after commit');
    assert.strictEqual(found.name, userName);

    // Clean up
    await db.User.delete(found);
  });

  it('[P0] rollback does not persist data', async () => {

    const userName = 'rollback-test-user';

    await db.connection.beginTrans();
    try {
      const user = User.create({
        name: userName,
        password: '123456',
      });
      await db.User.insert(user);
      await db.connection.rollback();
    } catch (e) {
      await db.connection.rollback();
      throw e;
    }

    // Verify data is NOT present after rollback
    const found = await db.User.query()
      .filter(p => p.name.eq(userName))
      .fetchAll();
    assert(found.length === 0, 'user should NOT be found after rollback');
  });
});
