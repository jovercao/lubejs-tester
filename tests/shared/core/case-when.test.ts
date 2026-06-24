import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.case', function () {
  const db = getProvider();

  it('[P0] simple case 简单分支 - 生成文本', function () {
    const t = table('t1');
    const ast = select(
      SQL.case()
        .when(t.a.eq(1), 'one')
        .when(t.a.eq(2), 'two')
        .else('other')
        .as('label')
    ).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['case-when.simple']);
  });
});

describe('SQL.case (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
    ]);
  });
  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] simple case 简单分支 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1 },
        { a: 2 },
        { a: 3 },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(
        t.a,
        SQL.case()
          .when(t.a.eq(1), 'one')
          .when(t.a.eq(2), 'two')
          .else('other')
          .as('label')
      ).from(t).orderBy(t.a.asc());
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 3);
      assert.strictEqual((result.rows[0] as any).label, 'one');
      assert.strictEqual((result.rows[1] as any).label, 'two');
      assert.strictEqual((result.rows[2] as any).label, 'other');
    });
  });
});
