import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.select', function () {
  const db = getProvider();

  it('[P0] 基本查询 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a, t.b).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['select.basic']);
  });

  it('[P0] 列别名 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a.as('id')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['select.alias']);
  });

  it('[P0] Star全列 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['select.star']);
  });
});

describe('SQL.select (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
      { name: 'b', type: DbType.string },
    ]);
  });
  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] 基本查询 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a, t.b).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
      assert.strictEqual(result.rows[0].a, 1);
      assert.strictEqual(result.rows[0].b, 'x');
      assert.strictEqual(result.rows[1].a, 2);
      assert.strictEqual(result.rows[1].b, 'y');
    });
  });

  it('[P0] 列别名 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a.as('id')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual((result.rows[0] as any).id, 1);
    });
  });

  it('[P0] Star全列 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.star).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].a, 1);
      assert.strictEqual(result.rows[0].b, 'x');
    });
  });
});
