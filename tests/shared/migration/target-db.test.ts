import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
  SQL,
} from 'lubejs';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { rm } from 'fs/promises';

/**
 * Plan 3 Task 2 — MigrateCli.targetDatabase / dropTargetDatabase / ensureTargetDatabase P0。
 *
 * dropTargetDatabase 后:目标库不存在(existsDatabase 查询无结果)。
 * ensureTargetDatabase 后:库存在,getDbSchema 返回定义的 schema(空表)。
 *
 * 不用 changeDatabase 到不存在的库来断言(会损坏连接),改用 SQL.existsDatabase 查询。
 * 非回滚隔离。
 */
describe('MigrateCli.targetDatabase [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let targetDatabase: string;
  const migrateDir = join(process.cwd(), '_targetdb-migrates');

  async function databaseExists(): Promise<boolean> {
    const result = await connection.queryScalar(
      SQL.select(SQL.literal(1)).where(SQL.existsDatabase(targetDatabase))
    );
    return result === 1;
  }

  before(async () => {
    const options = Object.assign({}, await getConnectionOptions(DB.name));
    targetDatabase = options.database || 'lubejs-orm-test';
    if (options.database) delete options.database;
    connection = await createConnection(options);
    await connection.open();
    await connection.changeToSysdb();
    dbContext = await createContext(DB, connection);
    cli = await new MigrateCli(dbContext, migrateDir);
    cli.targetDatabase = targetDatabase;

    await rm(migrateDir, { recursive: true, force: true });
    mkdirSync(migrateDir, { recursive: true });
  });

  after(async () => {
    await connection?.close();
    await rm(migrateDir, { recursive: true, force: true });
  });

  it('[P0] dropTargetDatabase 后目标库不存在', async () => {
    await cli.dropTargetDatabase();
    const exists = await databaseExists();
    assert.strictEqual(exists, false, 'dropTargetDatabase 后目标库应不存在');
  });

  it('[P0] ensureTargetDatabase 后库存在(getDbSchema 返回定义)', async () => {
    await cli.ensureTargetDatabase();
    const exists = await databaseExists();
    assert.strictEqual(exists, true, 'ensureTargetDatabase 后目标库应存在');
    const schema = await cli.getDbSchema();
    assert(schema, 'ensureTargetDatabase 后 getDbSchema 应返回定义的 schema');
    // 新建的空库无业务表
    assert.strictEqual(schema!.tables.length, 0, '新建库应无表');
  });

});

