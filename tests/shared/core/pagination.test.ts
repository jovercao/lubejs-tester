import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.pagination [P0]', function () {
  const db = getProvider();

  it('[P0] top - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a).from(t).top(2);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['pagination.top']);
  });

  it('[P0] limit+offset - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a).from(t).offset(1).limit(2);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['pagination.limitOffset']);
  });
});

describe('SQL.pagination [P0] (integration)', function () {
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

  it('[P0] top - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
        { a: 3, b: 'z' },
        { a: 4, b: 'w' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a).from(t).orderBy(t.a.asc()).top(2);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
    });
  });

  it('[P0] limit+offset - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
        { a: 3, b: 'z' },
        { a: 4, b: 'w' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a).from(t).orderBy(t.a.asc()).offset(1).limit(2);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
      assert.strictEqual(result.rows[0].a, 2);
      assert.strictEqual(result.rows[1].a, 3);
    });
  });
});
