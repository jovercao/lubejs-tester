import assert from 'assert';
import { User, DB } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('DbContext CRUD (orm)', function () {
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

  it('[P0] insert entity and get by id', async () => {

    const user = User.create({
      name: 'crud-test-user',
      password: '123456',
      description: 'test description',
    });

    await db.User.insert(user);
    assert(user.id !== undefined, 'user.id should be set after insert');

    const found = await db.User.get(user.id);
    assert(found !== undefined, 'user should be found by id');
    assert.strictEqual(found.name, user.name);
    assert.strictEqual(found.password, user.password);
    assert.strictEqual(found.description, user.description);
  });

  it('[P0] update entity', async () => {

    const user = User.create({
      name: 'update-test-user',
      password: '123456',
      description: 'original description',
    });
    await db.User.insert(user);

    user.name = 'updated-name';
    user.description = 'updated description';
    await db.User.update(user);

    const found = await db.User.get(user.id!);
    assert.strictEqual(found?.name, 'updated-name');
    assert.strictEqual(found?.description, 'updated description');
  });

  it('[P0] delete entity', async () => {

    const user = User.create({
      name: 'delete-test-user',
      password: '123456',
    });
    await db.User.insert(user);
    const userId = user.id!;

    await db.User.delete(user);

    // get() throws when not found
    await assert.rejects(async () => await db.User.get(userId));
  });

  it('[P0] save as insert (new entity)', async () => {

    const user = User.create({
      name: 'save-insert-user',
      password: '123456',
      description: 'save as insert',
    });

    await db.User.save(user);
    assert(user.id !== undefined, 'user.id should be set after save');

    const found = await db.User.get(user.id);
    assert(found !== undefined);
    assert.strictEqual(found.name, 'save-insert-user');
  });

  it('[P0] save as update (existing entity)', async () => {

    const user = User.create({
      name: 'save-update-user',
      password: '123456',
      description: 'original',
    });
    await db.User.save(user);

    user.name = 'save-updated-name';
    user.description = 'updated via save';
    await db.User.save(user);

    const found = await db.User.get(user.id!);
    assert.strictEqual(found?.name, 'save-updated-name');
    assert.strictEqual(found?.description, 'updated via save');
  });
});
