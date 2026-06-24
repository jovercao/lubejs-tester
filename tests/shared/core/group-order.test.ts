import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select, count } = SQL;

describe('SQL.group-order [P0]', function () {
  const db = getProvider();

  it('[P0] groupBy - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a, count(t.b)).from(t).groupBy(t.a);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['group-order.group']);
  });

  it('[P0] orderBy - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a).from(t).orderBy(t.a.asc());
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['group-order.order']);
  });
});

describe('SQL.group-order [P0] (integration)', function () {
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

  it('[P0] groupBy - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 1, b: 'y' },
        { a: 2, b: 'z' },
        { a: 2, b: 'w' },
        { a: 2, b: 'v' },
        { a: 3, b: 'u' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a, SQL.count(t.b).as('count')).from(t).groupBy(t.a);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 3);
    });
  });

  it('[P0] orderBy - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 3, b: 'c' },
        { a: 1, b: 'a' },
        { a: 2, b: 'b' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a).from(t).orderBy(t.a.asc());
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 3);
      assert.strictEqual(result.rows[0].a, 1);
      assert.strictEqual(result.rows[1].a, 2);
      assert.strictEqual(result.rows[2].a, 3);
    });
  });
});
