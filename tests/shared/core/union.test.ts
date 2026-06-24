import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select, union, unionAll } = SQL;

describe('SQL.union', function () {
  const db = getProvider();

  it('[P0] union 两表去重 - 生成文本', function () {
    const t1 = table('t1');
    const t2 = table('t2');
    const ast = union(select(t1.star).from(t1), select(t2.star).from(t2));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['union.basic']);
  });

  it('[P0] unionAll 不去重 - 生成文本', function () {
    const t1 = table('t1');
    const t2 = table('t2');
    const ast = unionAll(select(t1.star).from(t1), select(t2.star).from(t2));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['unionAll.basic']);
  });
});

describe('SQL.union (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
      { name: 'b', type: DbType.string },
    ]);
    await createFixture(conn, 't2', [
      { name: 'a', type: DbType.int32 },
      { name: 'b', type: DbType.string },
    ]);
  });
  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] union 两表去重 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);
      await seedTable(c, 't2', [{ a: 1, b: 'x' }, { a: 3, b: 'z' }]);
      const t1 = SQL.table('t1');
      const t2 = SQL.table('t2');
      const ast = SQL.union(SQL.select(t1.star).from(t1), SQL.select(t2.star).from(t2));
      const result = await c.query(ast);
      // (1,x)(2,y) ∪ (1,x)(3,z) 去重 -> 3 行
      assert.strictEqual(result.rows.length, 3);
    });
  });

  it('[P0] unionAll 不去重 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }]);
      await seedTable(c, 't2', [{ a: 1, b: 'x' }]);
      const t1 = SQL.table('t1');
      const t2 = SQL.table('t2');
      const ast = SQL.unionAll(SQL.select(t1.star).from(t1), SQL.select(t2.star).from(t2));
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
    });
  });
});
