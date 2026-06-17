import { createPool, DbType, Pool, SQL } from 'lubejs';
import assert from 'assert';

describe('test/core/pool.test.ts', function () {
  let pool: Pool;
  const healthChanges: Array<boolean | undefined> = [];
  this.timeout(0);

  before(async () => {
    pool = await createPool();
    pool.on('log', msg => {
      console.log(msg);
    });
    pool.on('healthy-changed', health => { healthChanges.push(health); });
    await pool.open();
  });

  after(async () => {
    await pool?.close();
  });

  it('连接池打开后应标记为健康并触发健康事件', async () => {
    assert.strictEqual(pool.healthy, true);
    assert.deepStrictEqual(healthChanges, [true]);
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

  it('函数命令执行后应释放连接', async () => {
    const beforeBorrowed = pool.borrowed;
    const result = await pool.executor.run(async conn => {
      const value = await conn.queryScalar(SQL.select(1));
      return {
        rows: [{ value }],
        rowsAffected: 0,
        output: {},
      } as any;
    });

    assert.strictEqual(result.rows[0].value, 1);
    assert.strictEqual(pool.borrowed, beforeBorrowed);
  });
});
