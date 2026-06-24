import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, withRollback, createFixture, seedTable } from '../../util';

const { table, select } = SQL;

describe('SQL.comparison', function () {
  const db = getProvider();

  it('[P0] eq 相等 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.eq(1));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.eq']);
  });

  it('[P0] neq 不等 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.neq(1));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.neq']);
  });

  it('[P0] lt 小于 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.lt(5));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.lt']);
  });

  it('[P0] lte 小于等于 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.lte(5));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.lte']);
  });

  it('[P0] gt 大于 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.gt(5));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.gt']);
  });

  it('[P0] gte 大于等于 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.gte(5));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.gte']);
  });

  it('[P0] and 逻辑与组合 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.eq(1).and(t.b.eq('x')));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.and']);
  });

  it('[P0] or 逻辑或组合 - 生成文本', function () {
    const t = table('t1');
    const ast = select(t.star).from(t).where(t.a.eq(1).or(t.a.eq(2)));
    const cmd = db.sqlifier.sqlify(ast) as SqlCommand;
    assert.strictEqual(cmd.sql, adapter.expect['comparison.or']);
  });
});

describe('SQL.comparison (integration)', function () {
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

  it('[P0] and/or 逻辑组合 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
        { a: 3, b: 'x' },
      ]);
      const t = SQL.table('t1');

      // Test AND: a=1 AND b='x' -> 1 row
      const astAnd = SQL.select(t.star).from(t).where(t.a.eq(1).and(t.b.eq('x')));
      const resultAnd = await c.query(astAnd);
      assert.strictEqual(resultAnd.rows.length, 1);
      assert.strictEqual(resultAnd.rows[0].a, 1);
      assert.strictEqual(resultAnd.rows[0].b, 'x');

      // Test OR: a=1 OR a=2 -> 2 rows
      const astOr = SQL.select(t.star).from(t).where(t.a.eq(1).or(t.a.eq(2)));
      const resultOr = await c.query(astOr);
      assert.strictEqual(resultOr.rows.length, 2);
    });
  });

  it('[P0] 比较运算符 - 执行', async function () {
    await withRollback(conn, async (c) => {
      await seedTable(c, 't1', [
        { a: 1, b: 'x' },
        { a: 5, b: 'y' },
      ]);
      const t = SQL.table('t1');

      // Test eq
      const astEq = SQL.select(t.star).from(t).where(t.a.eq(1));
      const resultEq = await c.query(astEq);
      assert.strictEqual(resultEq.rows.length, 1);

      // Test neq
      const astNeq = SQL.select(t.star).from(t).where(t.a.neq(1));
      const resultNeq = await c.query(astNeq);
      assert.strictEqual(resultNeq.rows.length, 1);

      // Test lt
      const astLt = SQL.select(t.star).from(t).where(t.a.lt(5));
      const resultLt = await c.query(astLt);
      assert.strictEqual(resultLt.rows.length, 1);

      // Test gte
      const astGte = SQL.select(t.star).from(t).where(t.a.gte(5));
      const resultGte = await c.query(astGte);
      assert.strictEqual(resultGte.rows.length, 1);
    });
  });
});
