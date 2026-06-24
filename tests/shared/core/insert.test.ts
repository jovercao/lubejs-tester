import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture } from '../../util';

const { table, insert, select } = SQL;

describe('SQL.insert', function () {
  const db = getProvider();

  it('[P0] 单行插入 - 生成文本', function () {
    const t = table('t1');
    const ast = insert(t).values([{ a: 1, b: 'x' }]);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['insert.single']);
  });

  it('[P0] 多行VALUES - 生成文本', function () {
    const t = table('t1');
    const ast = insert(t).values([{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['insert.multi']);
  });
});

describe('SQL.insert (integration)', function () {
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

  it('[P0] 单行插入 - 执行', async function () {
    await withRollback(conn, async (c) => {
      const t = SQL.table('t1');
      const result = await c.query(SQL.insert(t).values([{ a: 1, b: 'x' }]));
      assert.strictEqual(result.rowsAffected, 1);
      const queryResult = await c.query(SQL.select(t.star).from(t));
      assert.strictEqual(queryResult.rows.length, 1);
      assert.strictEqual(queryResult.rows[0].a, 1);
      assert.strictEqual(queryResult.rows[0].b, 'x');
    });
  });

  it('[P0] 多行VALUES - 执行', async function () {
    await withRollback(conn, async (c) => {
      const t = SQL.table('t1');
      const result = await c.query(SQL.insert(t).values([{ a: 1, b: 'x' }, { a: 2, b: 'y' }]));
      assert.strictEqual(result.rowsAffected, 2);
      const queryResult = await c.query(SQL.select(t.star).from(t).orderBy(t.a.asc()));
      assert.strictEqual(queryResult.rows.length, 2);
      assert.strictEqual(queryResult.rows[0].a, 1);
      assert.strictEqual(queryResult.rows[0].b, 'x');
      assert.strictEqual(queryResult.rows[1].a, 2);
      assert.strictEqual(queryResult.rows[1].b, 'y');
    });
  });
});
