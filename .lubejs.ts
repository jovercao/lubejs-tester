import { LubeConfig } from 'lubejs';

import driver from '@lubejs-driver';
import '@orm';
// import 'orm';

// declare module '@jovercao/mssql' = import('mssql')

export const config: LubeConfig = {
  default: 'DB',
  migrateDir: 'migrates',
  configures: {
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
};

export default config;
