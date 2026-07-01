import { LubeConfig } from 'lubejs';

import driver from '@lubejs-driver';
import '@orm';
// import 'orm';

// declare module '@jovercao/mssql' = import('mssql')

const host = process.env.LUBEJS_TEST_HOST || 'localhost';
// 各方言默认端口与用户
const dialect = driver.dialect as 'mssql' | 'mysql' | 'pgsql' | 'sqlite';
const defaultPort = dialect === 'mysql' ? 3306 : dialect === 'pgsql' ? 5432 : dialect === 'sqlite' ? 0 : 1433;
const defaultUser = dialect === 'mysql' ? 'root' : dialect === 'pgsql' ? 'postgres' : dialect === 'sqlite' ? '' : 'sa';
const port = Number(process.env.LUBEJS_TEST_PORT || defaultPort);
const user = process.env.LUBEJS_TEST_USER || defaultUser;
const password = dialect === 'sqlite' ? undefined : (process.env.LUBEJS_TEST_PASSWORD || 'Lubejs@Test123');
// sqlite 用临时文件库(多连接共享同一物理文件,支持 ORM DbContext 跨连接读写);
// :memory: 无法跨连接共享,故测试默认走临时文件。每进程唯一,测前删除。
const database = dialect === 'sqlite'
  ? (process.env.LUBEJS_TEST_SQLITE_DB || (() => {
      const os = require('os');
      const path = require('path');
      const fs = require('fs');
      const f = path.join(os.tmpdir(), `lubejs-sqlite-${process.pid}.db`);
      try { fs.unlinkSync(f); fs.unlinkSync(f + '-wal'); fs.unlinkSync(f + '-shm'); } catch { /* 不存在忽略 */ }
      return f;
    })())
  : 'lubejs-orm-test';

export const config: LubeConfig = {
  defaultConnection: 'DB',
  defaultPool: 'default',
  migrateDir: 'migrates',
  connections: {
    DB: {
      dialect: driver.dialect,
      ...(dialect !== 'sqlite' ? { host, user, password, port } : {}),
      database,
    },
    // 连接名保留 mssql-core-test（测试文件硬编码引用），其指向随当前 driver 切换
    'mssql-core-test': {
      dialect: driver.dialect,
      ...(dialect !== 'sqlite' ? { host, user, password, port } : {}),
      database: dialect === 'sqlite' ? database : 'lubejs-core-test-db',
    },
  },
  pools: {
    default: {
      // sqlite 嵌入式:单连接串行,避免多连接竞态;其他方言 min:5
      min: dialect === 'sqlite' ? 1 : 5,
      max: dialect === 'sqlite' ? 1 : 10,
      connectTimeout: 30000,
      idleTimeout: 15000,
      connection: 'mssql-core-test'
    }
  }
};

export default config;
