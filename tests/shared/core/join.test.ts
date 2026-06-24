import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.join [P0]', function () {
  const db = getProvider();

  it('[P0] inner join - 生成文本', function () {
    const t1 = table('t1');
    const t2 = table('t2');
    const ast = select(t1.a, t2.b).from(t1).join(t2, t1.a.eq(t2.t1id));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['join.inner']);
  });
});

describe('SQL.join [P0] (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
      { name: 'b', type: DbType.string },
    ]);
    await createFixture(conn, 't2', [
      { name: 'a', type: DbType.int32 },
      { name: 't1id', type: DbType.int32 },
      { name: 'b', type: DbType.string },
    ]);
  });

  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] inner join - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 't1-row1' },
        { a: 2, b: 't1-row2' },
        { a: 3, b: 't1-row3' },
      ]);
      await seedTable(c, 't2', [
        { a: 10, t1id: 1, b: 't2-row1' },
        { a: 20, t1id: 2, b: 't2-row2' },
        { a: 30, t1id: 99, b: 't2-row3' },
      ]);
      const t1 = SQL.table('t1');
      const t2 = SQL.table('t2');
      const ast = SQL.select(t1.a, t2.b).from(t1).join(t2, t1.a.eq(t2.t1id));
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
    });
  });
});
