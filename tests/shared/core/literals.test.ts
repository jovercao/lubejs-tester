import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select, literal, field } = SQL;

describe('SQL.literals', function () {
  const db = getProvider();

  it('[P0] literal 常量 - 生成文本', function () {
    const t = table('t1');
    const ast = select(literal(1).as('c')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['literals.const']);
  });

  it('[P0] field 列引用 - 生成文本', function () {
    const t = table('t1');
    const ast = select(field('a').as('a')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['literals.field']);
  });

  it('[P0] table 表引用 - 生成文本', function () {
    const t = SQL.table('t1');
    const ast = select(t.star).from(SQL.table('t1'));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['literals.table']);
  });
});

describe('SQL.literals (integration)', function () {
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

  it('[P0] literal 常量 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 1, b: 'x' }]);
      const t = SQL.table('t1');
      const ast = SQL.select(SQL.literal(1).as('c'), SQL.literal('hello').as('d')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual((result.rows[0] as any).c, 1);
      assert.strictEqual((result.rows[0] as any).d, 'hello');
    });
  });

  it('[P0] field 列引用 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 42, b: 'test' }]);
      const ast = SQL.select(SQL.field('a').as('a'), SQL.field('b').as('b')).from(SQL.table('t1'));
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].a, 42);
      assert.strictEqual(result.rows[0].b, 'test');
    });
  });
});
