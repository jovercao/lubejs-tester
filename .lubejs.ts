import { LubeConfig } from 'lubejs';

import driver from '@lubejs-driver';
import '@orm';
// import 'orm';

// declare module '@jovercao/mssql' = import('mssql')

export const config: LubeConfig = {
  defaultConnection: 'DB',
  defaultPool: 'default',
  migrateDir: 'migrates',
  connections: {
    DB: {
      dialect: driver.dialect,
      host: 'rancher.vm',
      user: 'sa',
      password: '!crgd-2021',
      database: 'lubejs-orm-test',
      port: 1433,
    },
    'mssql-core-test': {
      dialect: driver.dialect,
      host: 'rancher.vm',
      user: 'sa',
      password: '!crgd-2021',
      port: 1433,
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
