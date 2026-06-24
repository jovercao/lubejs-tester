import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select, literal } = SQL;

describe('SQL.arithmetic', function () {
  const db = getProvider();

  it('[P0] add 加法 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a.add(1).as('r')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['arithmetic.add']);
  });

  it('[P0] sub 减法 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a.sub(1).as('r')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['arithmetic.sub']);
  });

  it('[P0] mul 乘法 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a.mul(2).as('r')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['arithmetic.mul']);
  });

  it('[P0] div 除法 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a.div(2).as('r')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['arithmetic.div']);
  });

  it('[P0] mod 取模 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.a.mod(3).as('r')).from(t);
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['arithmetic.mod']);
  });
});

describe('SQL.arithmetic (integration)', function () {
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

  it('[P0] add 加法 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 5 }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a.add(1).as('r')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual((result.rows[0] as any).r, 6);
    });
  });

  it('[P0] sub 减法 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 5 }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a.sub(1).as('r')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual((result.rows[0] as any).r, 4);
    });
  });

  it('[P0] mul 乘法 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 5 }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a.mul(2).as('r')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual((result.rows[0] as any).r, 10);
    });
  });

  it('[P0] div 除法 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 10 }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a.div(2).as('r')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      // Note: division result type depends on dialect
      const r = (result.rows[0] as any).r;
      assert.ok(Number(r) === 5 || r === 5 || r === 5.0);
    });
  });

  it('[P0] mod 取模 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [{ a: 7 }]);
      const t = SQL.table('t1');
      const ast = SQL.select(t.a.mod(3).as('r')).from(t);
      const result = await c.query(ast);
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual((result.rows[0] as any).r, 1);
    });
  });
});
