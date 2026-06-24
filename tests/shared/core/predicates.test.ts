import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.predicates [P0]', function () {
  const db = getProvider();

  it('[P0] like - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.b.like('%x%'));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['predicates.like']);
  });

  it('[P0] in - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.in([1, 2, 3]));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['predicates.in']);
  });

  it('[P0] isNull - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.b.isNull());
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['predicates.isNull']);
  });

  it('[P0] isNotNull - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.b.isNotNull());
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['predicates.isNotNull']);
  });
});

describe('SQL.predicates [P0] (integration)', function () {
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

  it('[P0] like - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'apple' },
        { a: 2, b: 'banana' },
        { a: 3, b: 'cherry' },
        { a: 4, b: 'date' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.star).from(t).where(t.b.like('%a%'));
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 3);
    });
  });

  it('[P0] in - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'one' },
        { a: 2, b: 'two' },
        { a: 3, b: 'three' },
        { a: 4, b: 'four' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.star).from(t).where(t.a.in([1, 3, 5]));
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
    });
  });

  it('[P0] isNull - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'not null' },
        { a: 2, b: null },
        { a: 3, b: 'also not null' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.star).from(t).where(t.b.isNull());
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].a, 2);
    });
  });

  it('[P0] isNotNull - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'not null' },
        { a: 2, b: null },
        { a: 3, b: 'also not null' },
      ]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.star).from(t).where(t.b.isNotNull());
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 2);
    });
  });
});
