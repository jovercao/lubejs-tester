import { Connection, DbType, SQL } from 'lubejs';
import assert from 'assert';
import { connectToEmptyDb } from 'tests/util';

/**
 * MySQL 基础查询/CRUD/事务集成测试。
 * 依赖 docker 容器 lubejs-mysql（端口 3306，root/Lubejs@Test123）。
 */
describe('MySQL core query ———— tests/mysql/core/query.test.ts', function () {
  this.timeout(0);
  let db: Connection;

  before(async () => {
    db = await connectToEmptyDb({ config: 'mssql-core-test' });
  });

  after(async () => {
    await db?.close();
  });

  it('SELECT 标量', async () => {
    const v = await db.queryScalar(SQL.select(1));
    assert.strictEqual(v, 1);
  });

  it('字符串字面量查询', async () => {
    const { rows } = await db.query(SQL.select({ expr: 'hello' }));
    assert.strictEqual(rows[0].expr, 'hello');
  });

  it('建表 + INSERT + SELECT + UPDATE + DELETE', async () => {
    await db.query(SQL.dropTable.ifExists('items'));
    await db.query(
      SQL.createTable('items').as(({ column }) => [
        column('id', DbType.int32).identity().primaryKey(),
        column('name', DbType.string(100)).notNull(),
        column('age', DbType.int32).null(),
      ])
    );

    await db.insert('items', { name: 'a', age: 1 });
    await db.insert('items', { name: 'b', age: 2 });

    const { rows } = await db.query(
      SQL.select(SQL.star()).from('items').orderBy(SQL.field('id').asc())
    );
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].name, 'a');

    await db.update('items', { age: 10 }, { id: rows[0].id });
    const updated = await db.find('items', { id: rows[0].id });
    assert.strictEqual(updated?.age, 10);

    await db.delete('items', { id: rows[0].id });
    const after = await db.select('items');
    assert.strictEqual(after.length, 1);
  });

  it('事务回滚', async () => {
    await db.query(SQL.dropTable.ifExists('tx_test'));
    await db.query(
      SQL.createTable('tx_test').as(({ column }) => [
        column('id', DbType.int32).identity().primaryKey(),
        column('name', DbType.string(50)).notNull(),
      ])
    );
    await db.insert('tx_test', { name: 'row1' });
    const before = await db.select('tx_test');

    try {
      await db.trans(async () => {
        await db.insert('tx_test', { name: 'row2' });
        throw new Error('rollback test');
      });
    } catch (ex: any) {
      assert.strictEqual(ex.message, 'rollback test');
    }

    const after = await db.select('tx_test');
    assert.deepStrictEqual(after, before);
  });
});
