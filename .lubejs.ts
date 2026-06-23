import { LubeConfig } from 'lubejs';

import driver from '@lubejs-driver';
import '@orm';
// import 'orm';

// declare module '@jovercao/mssql' = import('mssql')

const host = process.env.LUBEJS_TEST_HOST || 'localhost';
// 各方言默认端口与用户
const isMysql = driver.dialect === 'mysql';
const defaultPort = isMysql ? 3306 : 1433;
const defaultUser = isMysql ? 'root' : 'sa';
const port = Number(process.env.LUBEJS_TEST_PORT || defaultPort);
const user = process.env.LUBEJS_TEST_USER || defaultUser;
const password = process.env.LUBEJS_TEST_PASSWORD || 'Lubejs@Test123';

export const config: LubeConfig = {
  defaultConnection: 'DB',
  defaultPool: 'default',
  migrateDir: 'migrates',
  connections: {
    DB: {
      dialect: driver.dialect,
      host,
      user,
      password,
      database: 'lubejs-orm-test',
      port,
    },
    // 连接名保留 mssql-core-test（测试文件硬编码引用），其指向随当前 driver 切换
    'mssql-core-test': {
      dialect: driver.dialect,
      host,
      user,
      password,
      port,
      database: 'lubejs-core-test-db',
    },
  },
  pools: {
    default: {
      min: 5,
      max: 10,
      connectTimeout: 30000,
      idleTimeout: 15000,
      connection: 'mssql-core-test'
    }
  }
};

export default config;
