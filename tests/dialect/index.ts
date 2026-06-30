/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbProvider, DbType, Expression } from 'lubejs';
import { driver } from '@lubejs-driver';

export interface DialectAdapter {
  driver: 'mssql' | 'mysql' | 'pgsql' | 'sqlite';
  /** 标识符引用:mssql [x] / mysql `x` / pgsql "x" / sqlite "x" */
  quote(name: string): string;
  /** 当前方言 now() 表达式 */
  now(): Expression;
  /** offline 期望 SQL 文本,按场景键索引 */
  expect: Record<string, string>;
  /** DbType -> 方言类型名 */
  typeName(dbType: DbType): string;
}

import { mssqlAdapter } from './mssql';
import { mysqlAdapter } from './mysql';
import { pgsqlAdapter } from './pgsql';
import { sqliteAdapter } from './sqlite';

const DRIVER = (driver as any).dialect as 'mssql' | 'mysql' | 'pgsql' | 'sqlite';

export const adapter: DialectAdapter =
  DRIVER === 'mysql'
    ? mysqlAdapter
    : DRIVER === 'pgsql'
    ? pgsqlAdapter
    : DRIVER === 'sqlite'
    ? sqliteAdapter
    : mssqlAdapter;

/** 获取当前方言的 DbProvider(用于 offline sqlify) */
export function getProvider(): DbProvider {
  return driver();
}
