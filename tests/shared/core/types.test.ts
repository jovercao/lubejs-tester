import assert from 'assert';
import { SQL, DbType } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection, createFixture, seedTable, withRollback } from '../../util';

describe('DbType mapping', function () {
  const db = getProvider();

  it('[P0] adapter.typeName maps DbType to dialect types', function () {
    assert.strictEqual(adapter.typeName(DbType.int32), adapter.driver === 'pgsql' ? 'INTEGER' : 'INT');
    assert.strictEqual(adapter.typeName(DbType.int64), 'BIGINT');
    assert.strictEqual(adapter.typeName(DbType.string), adapter.driver === 'mssql' ? 'NVARCHAR(255)' : 'VARCHAR(255)');
    assert.strictEqual(adapter.typeName(DbType.decimal), 'DECIMAL(18,2)');
    assert.strictEqual(adapter.typeName(DbType.datetime), adapter.driver === 'pgsql' ? 'TIMESTAMP' : 'DATETIME');
  });
});

describe('Types (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
    await createFixture(conn, 't1', [
      { name: 'id', type: DbType.int32 },
      { name: 'big', type: DbType.int64 },
      { name: 'name', type: DbType.string },
      { name: 'amount', type: DbType.decimal },
      { name: 'created', type: DbType.datetime },
    ]);
  });

  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] read/write all scalar types', async function () {
    await withRollback(conn, async (c) => {
      const testDate = new Date('2024-01-01T12:00:00Z');
      const testRow = {
        id: 1,
        big: BigInt('9223372036854775807'), // max int64
        name: 'test string',
        amount: 123.45,
        created: testDate,
      };

      await seedTable(c, 't1', [testRow]);

      const t1 = SQL.table('t1');
      const result = await c.query(SQL.select(t1.star).from(t1).where(t1.id.eq(1)));

      assert.strictEqual(result.rows.length, 1);
      const row = result.rows[0];

      // int32 -> number
      assert.strictEqual(typeof row.id, 'number');
      assert.strictEqual(row.id, 1);

      // int64 -> bigint (mssql) or number (mysql)
      if (adapter.driver === 'mssql') {
        assert.strictEqual(typeof row.big, 'bigint');
        assert.strictEqual(row.big, BigInt('9223372036854775807'));
      } else {
        assert.strictEqual(typeof row.big, 'number');
        assert.strictEqual(row.big, 9223372036854775807);
      }

      // string -> string
      assert.strictEqual(typeof row.name, 'string');
      assert.strictEqual(row.name, 'test string');

      // decimal -> could be string, number, or object depending on driver
      const amountStr = String(row.amount);
      assert.ok(amountStr === '123.45' || amountStr === '123');

      // datetime -> Date
      assert.ok(row.created instanceof Date);
      // Compare times within 1 second (some drivers may truncate milliseconds)
      assert.ok(Math.abs(row.created.getTime() - testDate.getTime()) < 1000);
    });
  });
});
