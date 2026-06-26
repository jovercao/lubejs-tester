import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
  DatabaseSchema,
  Migrate,
  MigrateBuilder,
  DbType,
} from 'lubejs';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { rm, writeFile } from 'fs/promises';

/**
 * Plan 3 Task 2 — MigrateCli.update / generate / down 回滚 P0。
 *
 * 链路:cli.add('Init') 生成首个迁移 → cli.update('Init') 应用 up(建全部实体表)
 *   → 断言 LUBE_MIGRATE_TABLE 已记录 Init
 *   → 手写 AddTable 迁移(timestamp 晚于 Init)→ cli.update('AddTable') 应用 up(建新表)
 *   → cli.update('Init') 触发 AddTable 的 down 回滚(单步回退)→ 断言新表消失。
 *
 * 非回滚隔离:dropTargetDatabase/重建。每文件独立 migrateDir。
 */
describe('MigrateCli.update [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let targetDatabase: string;
  const migrateDir = join(process.cwd(), '_update-migrates');

  async function writeMigrate(name: string, stamp: string, body: string): Promise<void> {
    await writeFile(
      join(migrateDir, `${stamp}_${name}.ts`),
      `import { Migrate, MigrateBuilder, DbType } from 'lubejs';\n${body}\n`,
      'utf-8'
    );
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

    // 首个迁移:由实体元数据 diff 生成(空库 → 完整实体 schema)
    await cli.add('Init');

    // 手写增量迁移:建一张独立表,up 建 / down 删(timestamp 晚于 Init,确保排在其后)
    await writeMigrate('AddTable', '29990101000000', `
export class AddTable implements Migrate {
  async up(b: MigrateBuilder, d: string): Promise<void> {
    b.createTable('MigrateUpdateTest').as(m => [
      m.column('id', DbType.int32).notNull().primaryKey(),
      m.column('name', DbType.string(50)).notNull(),
    ]);
  }
  async down(b: MigrateBuilder, d: string): Promise<void> {
    b.dropTable('MigrateUpdateTest');
  }
}
export default AddTable;
`);

    await cli.dropTargetDatabase();
    await cli.update('Init');
    await connection.changeDatabase(cli.targetDatabase);

    // cli.add('Init') 已触发 _list 扫盘缓存(当时目录仅有 Init),手写的 AddTable
    // 尚未进入缓存。清空私有缓存,使后续 update('AddTable') 重新扫盘发现它。
    (cli as unknown as { _migrateList: unknown })._migrateList = undefined;
  });

  after(async () => {
    await connection?.close();
    await rm(migrateDir, { recursive: true, force: true });
  });

  function table(schema: DatabaseSchema, name: string) {
    return schema.tables.find(t => t.name === name);
  }

  it('[P0] update 应用 Init 后 LUBE_MIGRATE_TABLE 已记录', async () => {
    const migrate = await cli.getDbMigrate();
    assert(migrate, 'getDbMigrate 应返回当前迁移记录');
    assert.strictEqual(migrate!.name, 'Init');
    const found = await cli.findMigrate('Init');
    assert(found, 'findMigrate(Init) 应能找到迁移定义');
  });

  it('[P0] update 应用 AddTable(up)后新表存在', async () => {
    await cli.update('AddTable');
    const schema = (await cli.getDbSchema())!;
    assert(table(schema, 'MigrateUpdateTest'), 'up 后 MigrateUpdateTest 表应存在');
    const migrate = await cli.getDbMigrate();
    assert.strictEqual(migrate?.name, 'AddTable');
  });

  it('[P0] update 回滚到 Init(down 单步回退)后新表消失', async () => {
    await cli.update('Init');
    const schema = (await cli.getDbSchema())!;
    assert(!table(schema, 'MigrateUpdateTest'), 'down 回滚后 MigrateUpdateTest 表应消失');
    const migrate = await cli.getDbMigrate();
    assert.strictEqual(migrate?.name, 'Init');
  });

});
