import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select, count, sum } = SQL;

describe('SQL.aggregate [P0]', function () {
  const db = getProvider();

  it('[P0] count - 生成文本', function () {
    const t = table('t1');
    const ast = select(count(t.a)).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['aggregate.count']);
  });

  it('[P0] sum - 生成文本', function () {
    const t = table('t1');
    const ast = select(sum(t.a)).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['aggregate.sum']);
  });
});

describe('SQL.aggregate [P0] (integration)', function () {
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

  it('[P0] count - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
        { a: 3, b: 'z' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(count(t.a).as('count')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(Number(result.rows[0].count), 3);
    });
  });

  it('[P0] sum - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
        { a: 3, b: 'z' },
        { a: 4, b: 'w' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(sum(t.a).as('sum')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(Number(result.rows[0].sum), 10);
    });
  });
});
