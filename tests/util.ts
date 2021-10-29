/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from '@orm';
import {
  Connection,
  loadConfig,
  createConnection,
  outputCommand,
  SQL,
  MigrateCli,
  createContext,
  QueryResult,
  Statement,
  getConnectionOptions,
  getDefaultConnectionOptions,
} from 'lubejs';

Reflect.set(BigInt.prototype, 'toJSON', function (this: BigInt) {
  return this.toString();
});

export async function connectToEmptyDb(opts?: {
  disableLog?: boolean;
  config?: string;
}): Promise<Connection> {
  const config = await loadConfig();
  let options = opts?.config
    ? await getConnectionOptions(opts.config)
    : await getDefaultConnectionOptions();

  const dbName = options.database || 'lubejs-test-db';

  if (options.database) {
    options = Object.assign({}, options);
    // 删除数据库配置，避免直接进入目标数据库中。
    delete options.database;
  }
  const db = await createConnection(options);
  if (!opts?.disableLog) {
    db.on('command', cmd => outputCommand(cmd, process.stdout));
  }

  await db.open();
  // 删除数据库
  await db.query(SQL.dropDatabase.ifExists(dbName));

  await db.query(SQL.createDatabase(dbName));
  await db.changeDatabase(dbName);
  return db;
}

export async function connectToEmptyDbContext(opts?: {
  disableLog?: boolean;
  config?: string;
}): Promise<DB> {
  let options = opts?.config
    ? await getConnectionOptions(opts.config)
    : await getConnectionOptions(DB.name);

  let targetDatabase: string;
  if (options.database) {
    options = Object.assign({}, options);
    // 删除数据库配置，避免直接进入目标数据库中。
    targetDatabase = options.database!;
    delete options.database;
  } else {
    targetDatabase = 'lubejs-orm-test';
  }
  const connection = await createConnection(options);
  await connection.open();
  if (!opts?.disableLog) {
    connection.on('command', cmd => outputCommand(cmd, process.stdout));
  }
  // connection.query(SQL.dropDatabase.ifExists(targetDatabase));
  const db = await createContext(DB, connection);

  const cli = await new MigrateCli(db);
  cli.targetDatabase = targetDatabase;
  await cli.dropTargetDatabase();
  await cli.sync();
  await connection.changeDatabase(cli.targetDatabase);

  return db;
}

/**
 * 执行语句块
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
