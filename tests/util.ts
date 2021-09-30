import { DB } from '@orm';
import {
  Connection,
  loadConfig,
  createConnection,
  outputCommand,
  SQL,
  MigrateCli,
  createContext,
} from 'lubejs';

export async function connectToEmptyDb(opts?: {
  disableLog?: boolean;
  config?: string;
}): Promise<Connection> {
  const config = await loadConfig();
  let options = opts?.config
    ? config.configures[opts.config]
    : config.configures[config.default];

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

  // 删除数据库
  await db.query(
    SQL.if(SQL.std.existsDatabase(dbName)).then(SQL.dropDatabase(dbName))
  );

  await db.query(SQL.createDatabase(dbName));
  await db.changeDatabase(dbName);
  return db;
}

export async function connectToEmptyDbContext(opts?: {
  disableLog?: boolean;
  config?: string;
}): Promise<DB> {
  const config = await loadConfig();
  let options = opts?.config
    ? config.configures[opts.config]
    : config.configures[config.default];

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
  if (!opts?.disableLog) {
    connection.on('command', cmd => outputCommand(cmd, process.stdout));
  }
  const db = await createContext(DB, connection);

  const cli = await new MigrateCli(db);
  cli.targetDatabase = targetDatabase;
  await cli.dropTargetDatabase();
  await cli.sync();
  await connection.changeDatabase(cli.targetDatabase);

  return db;
}
