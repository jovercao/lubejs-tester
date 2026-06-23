/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Connection,
  QueryResult,
  SQL,
  Statement,
} from 'lubejs';

/**
 * 在存储过程中执行语句块（mssql 特定，用于控制流语句测试）。
 */
export async function executeInProcedure(
  db: Connection,
  statements: Statement[] | Statement,
  spName = 'sp_control_test',
  dropIt = false
): Promise<QueryResult<any, any, [any]>> {
  await db.query(SQL.dropProcedure.ifExists(spName));
  await db.query(SQL.createProcedure(spName).as(statements as any));
  const result = await db.execute<any>(spName);
  if (dropIt) {
    await db.query(SQL.dropProcedure(spName));
  }
  return result;
}
