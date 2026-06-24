/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbType, Expression, SQL } from 'lubejs';
import type { DialectAdapter } from './index';

export const mssqlAdapter: DialectAdapter = {
  driver: 'mssql',
  quote: (name) => `[${name}]`,
  now: () => SQL.now() as Expression,
  typeName: (dbType: DbType) => {
    switch (dbType.type) {
      case 'INT32':
        return 'INT';
      case 'INT64':
        return 'BIGINT';
      case 'STRING':
        return 'NVARCHAR(255)';
      case 'DECIMAL':
        return 'DECIMAL(18,2)';
      case 'DATETIME':
        return 'DATETIME';
      default:
        return 'NVARCHAR(255)';
    }
  },
  expect: {
    'union.basic':
      'SELECT * FROM [t1] UNION SELECT * FROM [t2]',
    'unionAll.basic':
      'SELECT * FROM [t1] UNION ALL SELECT * FROM [t2]',
  },
};
