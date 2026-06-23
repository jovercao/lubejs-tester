import { DB, User } from '@orm';
import assert from 'assert';
import { connectToEmptyDbContext } from 'tests/util';

/**
 * MySQL repository 集成测试 —— 验证 MigrateCli.sync 建表 + ORM CRUD。
 * 依赖 docker lubejs-mysql。
 */
describe('MySQL repository insert ———— tests/mysql/repository/insert.test.ts', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
  });

  after(async () => {
    if (db?.connection?.opened) {
      await db.connection.close();
    }
  });

  it('MigrateCli.sync 建表 + User 插入与查询', async () => {
    const user = User.create({
      name: 'mysql test user',
      password: '123456',
    });
    await db.User.insert(user);
    assert(user.id !== undefined, '插入后应有 id');

    const fetched = await db.User.get(user.id!);
    assert(fetched !== undefined, '应能查回');
    assert.strictEqual(fetched!.name, 'mysql test user');
  });
});
