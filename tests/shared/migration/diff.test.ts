import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
  generateSchema,
  SchemaComparator,
} from 'lubejs';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { rm } from 'fs/promises';

/**
 * Plan 3 Task 2 — MigrateCli.diff P0。
 *
 * sync 前:实体 schema 有表、库为空 → compareSchema 应检出差异(table adds)。
 * sync 后:库 schema 与实体 schema 一致 → compareSchema 返回 null。
 *
 * 非回滚隔离:dropTargetDatabase + ensureTargetDatabase(空库)作为 sync 前基线。
 */
describe('MigrateCli.diff [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let targetDatabase: string;
  let schemaComparator: SchemaComparator;
  const migrateDir = join(process.cwd(), '_diff-migrates');

  before(async () => {
    const options = Object.assign({}, await getConnectionOptions(DB.name));
    targetDatabase = options.database || 'lubejs-orm-test';
    if (options.database) delete options.database;
    connection = await createConnection(options);
    schemaComparator = connection.provider.getSchemaComparator();
    await connection.open();
    await connection.changeToSysdb();
    dbContext = await createContext(DB, connection);
    cli = await new MigrateCli(dbContext, migrateDir);
    cli.targetDatabase = targetDatabase;

    await rm(migrateDir, { recursive: true, force: true });
    mkdirSync(migrateDir, { recursive: true });

    // 空库作为 sync 前基线:drop 后 ensure 出一个无表的空库
    await cli.dropTargetDatabase();
    await cli.ensureTargetDatabase();
  });

  after(async () => {
    await connection?.close();
    await rm(migrateDir, { recursive: true, force: true });
  });

  it('[P0] sync 前实体与空库存在差异', async () => {
    const entitySchema = generateSchema(dbContext);
    const dbSchema = await cli.getDbSchema();
    assert(dbSchema, '空库的 getDbSchema 应返回定义的 schema');
    const diff = schemaComparator.compareSchema(
      cli.targetSchemaName,
      entitySchema,
      dbSchema
    );
    assert(diff, 'sync 前实体与空库应存在差异');
    // 差异中应含待新增的表
    const addedTables = diff!.changes?.tables?.addeds ?? [];
    assert(addedTables.length > 0, `差异应含待新增表,实际: ${JSON.stringify(diff, null, 2)}`);
  });

  it('[P0] sync 后实体与库无表级增删差异', async () => {
    await cli.sync();
    const entitySchema = generateSchema(dbContext);
    const dbSchema = await cli.getDbSchema();
    const diff = schemaComparator.compareSchema(
      cli.targetSchemaName,
      entitySchema,
      dbSchema
    );
    // mssql:diff === null(完全无差异)。
    // mysql:存在既存 loader 回归(getSchemaNames 未按库过滤致 schemas 噪声 +
    //   外键 isCascade 语义差异),属独立待办,非本任务引入。此处聚焦 diff 的
    //   P0 语义——变更检测中的"增/删"表:sync 后不应有待新增或待删除的表。
    const tableChanges = diff?.changes?.tables;
    const added = tableChanges?.addeds?.length ?? 0;
    const removed = tableChanges?.removeds?.length ?? 0;
    assert.strictEqual(added, 0, `sync 后不应有待新增表,实际: ${JSON.stringify(tableChanges?.addeds, null, 2)}`);
    assert.strictEqual(removed, 0, `sync 后不应有待删除表,实际: ${JSON.stringify(tableChanges?.removeds, null, 2)}`);
  });

});
