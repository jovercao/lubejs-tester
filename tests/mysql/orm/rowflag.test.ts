import { DB, Order } from '@orm';
import assert from 'assert';
import { connectToEmptyDbContext } from 'tests/util';

/**
 * MySQL rowflag 应用层维护集成测试 —— 验证 mysql 无 DB 自动行标记时，
 * ORM 在 Repository.update 时自动为 rowflag 列追加 rowflag = rowflag + 1。
 * 依赖 docker lubejs-mysql。
 */
describe('MySQL repository rowflag ———— tests/mysql/repository/rowflag.test.ts', function () {
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

  it('update 时 rowflag 自动 +1', async () => {
    const order = Order.create({
      description: 'rowflag test',
    });
    await db.Order.insert(order);
    assert(order.id !== undefined, '插入后应有 id');

    const before = await db.Order.get(order.id!);
    assert(before !== undefined, '应能查回');
    const flagBefore = Number((before!.rowflag as any) ?? 0);

    // 修改非 rowflag 字段，rowflag 应由 ORM 自动 +1
    before!.description = 'rowflag test updated';
    await db.Order.update(before!);

    const after = await db.Order.get(order.id!);
    assert(after !== undefined, '更新后应能查回');
    const flagAfter = Number((after!.rowflag as any) ?? 0);

    assert(
      flagAfter === flagBefore + 1,
      `rowflag 应自动 +1：before=${flagBefore}, after=${flagAfter}`
    );
  });
});
