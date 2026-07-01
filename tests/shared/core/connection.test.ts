import assert from 'assert';
import { SQL, DbType } from 'lubejs';
import { adapter } from '../../dialect';
import { getCoreConnection, createFixture, seedTable } from '../../util';

describe('Connection (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    // For SQLite: clean up any existing table first
    const t1 = SQL.table('t1');
    try {
      await conn.query(SQL.dropTable(t1).ifExists());
    } catch (e) {
      // ignore errors
    }
    await createFixture(conn, 't1', [
      { name: 'a', type: DbType.int32 },
      { name: 'b', type: DbType.string },
    ]);
  });

  after(async function () {
    if (conn) await conn.close();
  });

  beforeEach(async function () {
    const t1 = SQL.table('t1');
    await conn.query(SQL.delete(t1));
  });

  it('[P0] open/close connection', async function () {
    assert.strictEqual(conn.opened, true, 'connection should be opened initially');

    await conn.close();
    assert.strictEqual(conn.opened, false, 'connection should be closed after close()');

    await conn.open();
    assert.strictEqual(conn.opened, true, 'connection should be opened after open()');

    // For SQLite: in-memory database gets cleared when the last connection closes,
    // so we need to recreate our test table if it doesn't exist
    if (adapter.driver === 'sqlite') {
      await createFixture(conn, 't1', [
        { name: 'a', type: DbType.int32 },
        { name: 'b', type: DbType.string },
      ]);
    }

    // Verify query still works after reopen
    const t1 = SQL.table('t1');
    const result = await conn.query(SQL.select(t1.star).from(t1));
    assert.strictEqual(result.rows.length, 0);
  });

  it('[P0] conn.query returns rows', async function () {
    await seedTable(conn, 't1', [{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);

    const t1 = SQL.table('t1');
    const result = await conn.query(SQL.select(t1.star).from(t1));

    assert.strictEqual(result.rows.length, 2);
    assert.strictEqual(result.rows[0].a, 1);
    assert.strictEqual(result.rows[0].b, 'x');
    assert.strictEqual(result.rows[1].a, 2);
    assert.strictEqual(result.rows[1].b, 'y');
  });

  it('[P0] conn.queryScalar returns scalar value', async function () {
    await seedTable(conn, 't1', [{ a: 42, b: 'answer' }]);

    const t1 = SQL.table('t1');
    const value = await conn.queryScalar(SQL.select(t1.a).from(t1).where(t1.a.eq(42)));

    assert.strictEqual(value, 42);
  });

  it('[P0] conn.queryScalar with scalar select', async function () {
    const value = await conn.queryScalar(SQL.select(SQL.literal(123)));
    assert.strictEqual(value, 123);
  });

  it('[P0] conn.execute stored procedure', async function () {
    if (adapter.driver === 'sqlite') {
      // SQLite doesn't support stored procedures
      this.skip();
    }

    // Create a simple stored procedure
    const spName = 'sp_test_connection';

    // Drop if exists (dialect-specific)
    if (adapter.driver === 'mssql') {
      await conn.query(`IF OBJECT_ID('${spName}', 'P') IS NOT NULL DROP PROCEDURE ${adapter.quote(spName)}`);
      await conn.query(`
        CREATE PROCEDURE ${adapter.quote(spName)}
        AS
        BEGIN
          SELECT 1 AS result;
        END
      `);
    } else if (adapter.driver === 'pgsql') {
      // pg 存储过程体用 plpgsql,SELECT 需 INTO/PERFORM,此处用 PERFORM 丢弃结果
      await conn.query(`DROP PROCEDURE IF EXISTS ${adapter.quote(spName)}`);
      await conn.query(`
        CREATE PROCEDURE ${adapter.quote(spName)}()
        LANGUAGE plpgsql
        AS $$
        BEGIN
          PERFORM 1;
        END $$;
      `);
    } else {
      await conn.query(`DROP PROCEDURE IF EXISTS ${adapter.quote(spName)}`);
      await conn.query(`
        CREATE PROCEDURE ${adapter.quote(spName)}()
        BEGIN
          SELECT 1 AS result;
        END
      `);
    }

    try {
      const result = await conn.execute(spName);
      // Execute behavior varies by dialect - just verify it didn't throw
      assert.ok(result, 'execute should return a result');
    } finally {
      // Cleanup
      if (adapter.driver === 'pgsql') {
        await conn.query(`DROP PROCEDURE IF EXISTS ${adapter.quote(spName)}`);
      } else {
        await conn.query(`DROP PROCEDURE ${adapter.quote(spName)}`);
      }
    }
  });
});
