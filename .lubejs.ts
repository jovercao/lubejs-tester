import { LubeConfig } from 'lubejs';

import driver from '@lubejs-driver';
import '@orm';
// import 'orm';

// declare module '@jovercao/mssql' = import('mssql')

const host = process.env.LUBEJS_TEST_HOST || 'localhost';
const port = Number(process.env.LUBEJS_TEST_PORT || 1433);
const user = process.env.LUBEJS_TEST_USER || 'sa';
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
