import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, delete: deleteFrom, select } = SQL;

describe('SQL.delete', function () {
  const db = getProvider();

  it('[P0] 条件删除 - 生成文本', function () {
    const t = table('t1');
    const ast = deleteFrom(t).where(t.a.eq(1));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['delete.cond']);
  });
});

describe('SQL.delete (integration)', function () {
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

  it('[P0] 条件删除 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }, { a: 2, b: 'y' }, { a: 3, b: 'z' }]);
      const t = SQL.table('t1');
      const result = await c.query(SQL.delete(t).where(t.a.eq(2)));
      assert.strictEqual(result.rowsAffected, 1);
      const queryResult = await c.query(SQL.select(t.star).from(t).orderBy(t.a.asc()));
      assert.strictEqual(queryResult.rows.length, 2);
      assert.strictEqual(queryResult.rows[0].a, 1);
      assert.strictEqual(queryResult.rows[1].a, 3);
    });
  });
});
