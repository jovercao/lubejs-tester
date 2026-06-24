import assert from 'assert';
import { User, DB } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Repository: CRUD (orm)', function () {
  this.timeout(0);
  let db: DB;

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') {
      this.skip();
    }
  });

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] insert via repository, assert id set, get back', async () => {
    const user = User.create({
      name: 'test-user',
      password: 'test-pass',
      description: 'test description',
    });

    await db.User.insert(user);
    assert(user.id !== undefined, 'id should be set after insert');

    const retrieved = await db.User.get(user.id!);
    assert(retrieved !== undefined, 'should retrieve inserted user');
    assert.strictEqual(retrieved.name, user.name);
    assert.strictEqual(retrieved.password, user.password);
    assert.strictEqual(retrieved.description, user.description);
  });

  it('[P0] update via repository, change name, assert new name', async () => {
    const user = User.create({
      name: 'update-me',
      password: 'pass123',
    });

    await db.User.insert(user);
    const originalId = user.id!;

    user.name = 'updated-name';
    await db.User.update(user);

    const retrieved = await db.User.get(originalId);
    assert.strictEqual(retrieved?.name, 'updated-name');
  });

  it('[P0] delete via repository (entity), get throws', async () => {
    const user = User.create({
      name: 'delete-me',
      password: 'delete-pass',
    });

    await db.User.insert(user);
    const userId = user.id!;

    await db.User.delete(user);
    await assert.rejects(async () => await db.User.get(userId));
  });

  it('[P0] delete via repository (by key), get throws', async () => {
    const user = User.create({
      name: 'delete-by-id',
      password: 'delete-pass2',
    });

    await db.User.insert(user);
    const userId = user.id!;

    await db.User.delete(userId);
    await assert.rejects(async () => await db.User.get(userId));
  });

  it('[P0] db.getRepository(User) equivalent works', async () => {
    const repo = db.getRepository(User);
    const user = User.create({
      name: 'via-get-repo',
      password: 'repo-pass',
    });

    await repo.insert(user);
    assert(user.id !== undefined);

    const retrieved = await repo.get(user.id!);
    assert.strictEqual(retrieved?.name, 'via-get-repo');

    retrieved!.name = 'updated-via-repo';
    await repo.update(retrieved!);

    const afterUpdate = await repo.get(user.id!);
    assert.strictEqual(afterUpdate?.name, 'updated-via-repo');

    await repo.delete(retrieved!);
    await assert.rejects(async () => await repo.get(user.id!));
  });
});
