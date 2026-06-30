/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbType, Expression, SQL } from 'lubejs';
import type { DialectAdapter } from './index';

/**
 * SQLite 方言适配器。
 * 与 mssql/mysql/pgsql 的关键差异:
 * - 标识符引用:双引号 "name"(内部 " 转义为 "")
 * - 字符串字面量:单引号 'x'
 * - 分页:LIMIT N OFFSET M(与 pgsql 一致)
 * - TOP:用 LIMIT N 表达
 * - now():CURRENT_TIMESTAMP
 * - 函数名:不加引号(sqlite 标准)
 */
export const sqliteAdapter: DialectAdapter = {
  driver: 'sqlite',
  quote: (name) => '"' + name.replace(/"/g, '""') + '"',
  now: () => SQL.now() as Expression,
  typeName: (dbType: DbType) => {
    switch (dbType.type) {
      case 'INT32': case 'INT64': case 'INT16': case 'INT8': case 'UINT8': case 'BOOLEAN':
        return 'INTEGER';
      case 'FLOAT32': case 'FLOAT64':
        return 'REAL';
      case 'BINARY':
        return 'BLOB';
      case 'DECIMAL':
        return 'NUMERIC(18,2)';
      case 'STRING':
        return 'VARCHAR(255)';
      case 'DATE': case 'DATETIME': case 'DATETIMEOFFSET': case 'TIME': case 'UUID': case 'JSON': case 'ENUM': case 'FIXEDSTRING':
        return 'TEXT';
      default:
        return 'TEXT';
    }
  },
  expect: {
    // 离线期望 SQL,由 sqlite Sqlifier 实际编译产出填入
    // 初始可空,逐步按 tests/shared/core 用例补齐
  },
};
