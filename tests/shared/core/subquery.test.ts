import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.subquery', function () {
  const db = getProvider();

  it('[P0] exists 存在子查询 - 生成文本', function () {
    const t1 = table('t1');
    const t2 = table('t2');
    const ast = select(t1.a)
      .from(t1)
      .where(SQL.exists(select(t2.a).from(t2).where(t2.a.eq(t1.a))));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['subquery.exists']);
  });
});

describe('SQL.subquery (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
    ]);
    await createFixture(conn, 't2', [
      { name: 'a', type: DbType.int32 },
    ]);
  });
  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] exists 存在子查询 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1 }, { a: 2 }]);
      await seedTable(c, 't2', [{ a: 1 }]);
      const t1 = SQL.table('t1');
      const t2 = SQL.table('t2');
      const ast = SQL.select(t1.a)
        .from(t1)
        .where(SQL.exists(SQL.select(t2.a).from(t2).where(t2.a.eq(t1.a))))
        .orderBy(t1.a.asc());
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].a, 1);
    });
  });
});
