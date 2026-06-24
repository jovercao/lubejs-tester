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
  getConnectionOptions,
  getDefaultConnectionOptions,
  DbType,
} from 'lubejs';
import { adapter } from './dialect';

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
 * 在事务内执行回调,结束后自动 rollback,保证用例间隔离。
 * 用于"数据读写"类集成用例。
 */
export async function withRollback<T>(
  conn: Connection,
  fn: (conn: Connection) => Promise<T>
): Promise<T> {
  await conn.beginTrans();
  try {
    return await fn(conn);
  } finally {
    await conn.rollback();
  }
}

/**
 * 批量插入种子数据。
 */
export async function seedTable(
  conn: Connection,
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;
  const tbl = SQL.table(table);
  await conn.query(SQL.insert(tbl).values(rows));
}

/**
 * 按列规格建一张临时表(方言无关类型映射走 adapter)。
 */
export async function createFixture(
  conn: Connection,
  table: string,
  columns: { name: string; type: DbType; nullable?: boolean }[]
): Promise<void> {
  const colDefs = columns.map((c) => {
    const t = adapter.typeName(c.type);
    const nullPart = c.nullable ? 'NULL' : 'NOT NULL';
    return `${adapter.quote(c.name)} ${t} ${nullPart}`;
  });
  await conn.query(
    `CREATE TABLE ${adapter.quote(table)} (${colDefs.join(', ')})`
  );
}

/**
 * 取 core 测试用的连接(指向 mssql-core-test 配置,随 driver 切换)。
 */
export async function getCoreConnection(): Promise<Connection> {
  return connectToEmptyDb({ config: 'mssql-core-test' });
}
