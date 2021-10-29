import { createPool, SQL } from 'lubejs';

describe('test/core/pool.test.ts', function () {
  it('连接测试', async () => {
    const pool = await createPool();
    await pool.open();
    await pool.executor.queryScalar(SQL.select(1));
    await pool.close();
  });
});
