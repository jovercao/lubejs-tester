import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, update, select } = SQL;

describe('SQL.update', function () {
  const db = getProvider();

  it('[P0] 基本更新(无where) - 生成文本', function () {
    const t = table('t1');
    const ast = update(t).set({ b: 'z' });
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['update.basic']);
  });

  it('[P0] 多列更新 - 生成文本', function () {
    const t = table('t1');
    const ast = update(t).set({ a: 1, b: 'y' });
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['update.multi']);
  });

  it('[P0] 条件更新 - 生成文本', function () {
    const t = table('t1');
    const ast = update(t).set({ b: 'z' }).where(t.a.eq(1));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['update.cond']);
  });
});

describe('SQL.update (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
      { name: 'b', type: DbType.string, nullable: true },
    ]);
  });
  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] 基本更新(无where) - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);
      const t = SQL.table('t1');
      const result = await c.query(SQL.update(t).set({ b: 'z' }));
      assert.strictEqual(result.rowsAffected, 2);
      const queryResult = await c.query(SQL.select(t.star).from(t));
      assert.strictEqual(queryResult.rows.length, 2);
      assert.strictEqual(queryResult.rows[0].b, 'z');
      assert.strictEqual(queryResult.rows[1].b, 'z');
    });
  });

  it('[P0] 多列更新 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }]);
      const t = SQL.table('t1');
      const result = await c.query(SQL.update(t).set({ a: 99, b: 'updated' }));
      assert.strictEqual(result.rowsAffected, 1);
      const queryResult = await c.query(SQL.select(t.star).from(t));
      assert.strictEqual(queryResult.rows.length, 1);
      assert.strictEqual(queryResult.rows[0].a, 99);
      assert.strictEqual(queryResult.rows[0].b, 'updated');
    });
  });

  it('[P0] 条件更新 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }, { a: 2, b: 'y' }, { a: 3, b: 'z' }]);
      const t = SQL.table('t1');
      const result = await c.query(SQL.update(t).set({ b: 'UPDATED' }).where(t.a.eq(2)));
      assert.strictEqual(result.rowsAffected, 1);
      const queryResult = await c.query(SQL.select(t.star).from(t).orderBy(t.a.asc()));
      assert.strictEqual(queryResult.rows.length, 3);
      assert.strictEqual(queryResult.rows[0].a, 1);
      assert.strictEqual(queryResult.rows[0].b, 'x'); // 未更新
      assert.strictEqual(queryResult.rows[1].a, 2);
      assert.strictEqual(queryResult.rows[1].b, 'UPDATED'); // 已更新
      assert.strictEqual(queryResult.rows[2].a, 3);
      assert.strictEqual(queryResult.rows[2].b, 'z'); // 未更新
    });
  });
});
