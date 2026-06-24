import assert from 'assert';
import { SQL, DbType } from 'lubejs';
import { getCoreConnection, createFixture } from '../../util';

describe('Transaction (integration)', function () {
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

  async function cleanup() {
    const t1 = SQL.table('t1');
    await conn.query(SQL.delete(t1));
  }

  beforeEach(async function () {
    await cleanup();
  });

  afterEach(async function () {
    await cleanup();
  });

  it('[P0] commit persists data', async function () {
    const t1 = SQL.table('t1');

    await conn.beginTrans();
    try {
      await conn.query(SQL.insert(t1).values({ a: 100 }));
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    }

    // Verify the row is present after commit
    const result = await conn.query(SQL.select(t1.star).from(t1));
    assert.strictEqual(result.rows.length, 1);
    assert.strictEqual(result.rows[0].a, 100);
  });

  it('[P0] rollback discards data', async function () {
    const t1 = SQL.table('t1');

    await conn.beginTrans();
    try {
      await conn.query(SQL.insert(t1).values({ a: 200 }));
      await conn.rollback();
    } catch (e) {
      await conn.rollback();
      throw e;
    }

    // Verify the row is NOT present after rollback
    const result = await conn.query(SQL.select(t1.star).from(t1));
    assert.strictEqual(result.rows.length, 0);
  });
});
