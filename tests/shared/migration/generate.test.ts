import assert from 'assert';
import { existsSync } from 'fs';
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
 * Plan 3 Task 2 — MigrateCli.generate P0。
 *
 * 验证 cli.add 生成的迁移文件与快照存在,且 getEntitySchema 与 generateSchema 一致,
 * 快照 schema 与实体 schema 经比较器无差异。
 */
describe('MigrateCli.generate [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let targetDatabase: string;
  let schemaComparator: SchemaComparator;
  const migrateDir = join(process.cwd(), '_generate-migrates');

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
  });

  after(async () => {
    await connection?.close();
    await rm(migrateDir, { recursive: true, force: true });
  });

  let info: { path: string; snapshotPath: string; name: string };

  it('[P0] add 生成迁移文件与快照文件存在', async () => {
    info = await cli.add('Gen');
    assert(existsSync(info.path), `迁移文件应存在: ${info.path}`);
    assert(existsSync(info.snapshotPath), `快照文件应存在: ${info.snapshotPath}`);
    assert.strictEqual(info.name, 'Gen');
  });

  it('[P0] getEntitySchema 与 generateSchema 一致', async () => {
    const entitySchema = cli.getEntitySchema();
    const metadataSchema = generateSchema(dbContext);
    // 两者由同一元数据生成,表集合应一致
    assert.deepStrictEqual(
      entitySchema.tables.map(t => t.name).sort(),
      metadataSchema.tables.map(t => t.name).sort(),
      'getEntitySchema 与 generateSchema 的表名集合应一致'
    );
  });

  it('[P0] 快照 schema 与实体 schema 无差异', async () => {
    const snapshot = (await import(info.snapshotPath)).default;
    const entitySchema = generateSchema(dbContext);
    const diff = schemaComparator.compareSchema(undefined, snapshot, entitySchema);
    assert(!diff, `快照与实体 schema 应无差异,实际: ${JSON.stringify(diff, null, 2)}`);
  });

});
