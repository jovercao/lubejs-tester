import { createPool, DbType, Pool, SQL } from 'lubejs';
import assert from 'assert';

describe('test/core/pool.test.ts', function () {
  let pool: Pool;
  this.timeout(0);

  before(async () => {
    pool = await createPool();
    pool.on('log', msg => {
      console.log(msg);
    });
    await pool.open();
  });

  after(async () => {
    await pool?.close();
  });

  it('全局连接查询测试', async () => {
    await pool.executor.queryScalar(SQL.select(1));
  });

  it('全局连接事务测试', async () => {
    await pool.executor.trans(async conn => {
      await conn.query([
        SQL.dropTable.ifExists('table1'),
        SQL.createTable('table1').as(({ column }) => [
          column('id', DbType.int64).identity(1, 1).primaryKey(),
          column('name', DbType.string(100)),
        ]),
      ]);

      await conn.insert('table1', {
        name: 'This is row1',
      });
      await conn.beginTrans();
      await conn.insert('table1', {
        name: 'This is row2',
      });
      const { rows: rows1 } = await conn.query(
        SQL.select(SQL.star()).from('table1')
      );
      assert(rows1.length === 2);

      await conn.rollback();
      const { rows: rows2 } = await conn.query(
        SQL.select(SQL.star()).from('table1')
      );
      assert(rows2.length === 1 && rows2[0].name === 'This is row1');
    });

    const { rows } = await pool.executor.query(
      SQL.select(SQL.star()).from('table1')
    );
    assert(rows.length === 1 && rows[0].name === 'This is row1');
  });

  it('连接数测试', async () => {
    await Promise.all([
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
      pool.acquire().then(conn => {
        return conn.query(SQL.select(1)).then(() => {
          return pool.release(conn);
        });
      }),
    ]);
  });
});
