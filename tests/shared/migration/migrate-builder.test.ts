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
} from 'lubejs';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { rm, writeFile } from 'fs/promises';

/**
 * Plan 3 Task 4 — MigrationBuilder API P0。
 *
 * 用手写 migrate 文件(up/down 回调内调 MigrateBuilder)走 cli.update 应用与回滚,
 * 断言表/列/索引/外键的创建与撤销。
 *
 * 已修(本任务)的 3 个 core bug:
 * - mysql existsDatabase 未实现 → 补 information_schema.SCHEMATA 实现。
 * - SnapshotMigrateTracker drop 成员查找误用 $kind → 改 $name(3 处)。
 * - sqlifyDelete 带别名漏 FROM → 补 `DELETE alias FROM table AS alias`。
 *
 * 仍 skip:
 * - alterColumn:#15 已统一,但 diff 受 compareScalar 纯标量漏检 bug 影响
 *   (见 .claude-tasks/TODO-compareScalar-scalar-diff-bug.md),方言差异大,留待修复后补。
 */
describe('MigrationBuilder [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let targetDatabase: string;
  const migrateDir = join(process.cwd(), '_builder-migrates');

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

    // CreateMigrate:建父表/子表(列、内联 PK、内联外键)+ 索引
    await writeMigrate('CreateMigrate', '20000101000000', `
export class CreateMigrate implements Migrate {
  async up(b: MigrateBuilder, d: string): Promise<void> {
    b.createTable('BuilderParent').as(m => [
      m.column('id', DbType.int32).notNull().primaryKey(),
      m.column('name', DbType.string(50)).notNull(),
    ]);
    b.createTable('BuilderChild').as(m => [
      m.column('id', DbType.int32).notNull().primaryKey(),
      m.column('parentId', DbType.int32).null(),
      m.column('code', DbType.string(20)).notNull(),
      m.foreignKey('FK_Child_Parent').on('parentId').reference('BuilderParent', ['id']),
    ]);
    b.createIndex('IX_Child_Code').on('BuilderChild', ['code']);
  }
  async down(b: MigrateBuilder, d: string): Promise<void> {
    b.dropTable('BuilderChild');
    b.dropTable('BuilderParent');
  }
}
export default CreateMigrate;
`);

    // AlterMigrate:alterColumn 修改列可空性(up: notNull→null,down 反向)
    await writeMigrate('AlterMigrate', '20000101000001', `
export class AlterMigrate implements Migrate {
  async up(b: MigrateBuilder, d: string): Promise<void> {
    b.alterColumn('BuilderParent', column => column('name', DbType.string(50)).null());
  }
  async down(b: MigrateBuilder, d: string): Promise<void> {
    b.alterColumn('BuilderParent', column => column('name', DbType.string(50)).notNull());
  }
}
export default AlterMigrate;
`);

    // DropMigrate:撤销索引/外键/列(up),down 恢复
    await writeMigrate('DropMigrate', '20000101000002', `
export class DropMigrate implements Migrate {
  async up(b: MigrateBuilder, d: string): Promise<void> {
    b.dropIndex('BuilderChild', 'IX_Child_Code');
    b.alterTable('BuilderChild').drop(m => m.foreignKey('FK_Child_Parent'));
    b.alterTable('BuilderChild').drop(m => m.column('code'));
  }
  async down(b: MigrateBuilder, d: string): Promise<void> {
    b.alterTable('BuilderChild').add(m => m.column('code', DbType.string(20)).notNull());
    b.alterTable('BuilderChild').add(m => m.foreignKey('FK_Child_Parent').on('parentId').reference('BuilderParent', ['id']));
    b.createIndex('IX_Child_Code').on('BuilderChild', ['code']);
  }
}
export default DropMigrate;
`);

    await cli.dropTargetDatabase();
    await cli.update('CreateMigrate');
    await connection.changeDatabase(cli.targetDatabase);
  });

  after(async () => {
    await connection?.close();
    await rm(migrateDir, { recursive: true, force: true });
  });

  function table(schema: DatabaseSchema, name: string) {
    const t = schema.tables.find(t => t.name === name);
    assert(t, `表 ${name} 应存在,实际表: ${schema.tables.map(t => t.name).join(', ')}`);
    return t;
  }

  it('[P0] createTable + 列 + 主键(PK)', async () => {
    const schema = (await cli.getDbSchema())!;
    const parent = table(schema, 'BuilderParent');
    assert(parent.columns.find(c => c.name === 'id'), '应含 id 列');
    assert(parent.columns.find(c => c.name === 'name'), '应含 name 列');
    assert(parent.primaryKey, 'BuilderParent 应有主键');
    assert(parent.primaryKey!.columns.find(c => c.name === 'id'), '主键应含 id');
  });

  it('[P0] createIndex 索引', async () => {
    const schema = (await cli.getDbSchema())!;
    const child = table(schema, 'BuilderChild');
    const idx = child.indexes.find(i => i.name === 'IX_Child_Code');
    assert(idx, `应存在索引 IX_Child_Code,实际: ${child.indexes.map(i => i.name).join(', ')}`);
    assert(idx!.columns.find(c => c.name === 'code'), '索引应含 code 列');
  });

  it('[P0] addForeignKey 外键(建表内联)', async () => {
    const schema = (await cli.getDbSchema())!;
    const child = table(schema, 'BuilderChild');
    const fk = child.foreignKeys.find(fk => fk.name === 'FK_Child_Parent');
    assert(fk, `应存在外键 FK_Child_Parent,实际: ${child.foreignKeys.map(fk => fk.name).join(', ')}`);
    assert.strictEqual(fk!.referenceTable, 'BuilderParent');
    assert(fk!.columns.includes('parentId'), '外键列应含 parentId');
    assert(fk!.referenceColumns.includes('id'), '引用列应含 id');
  });

  // NOTE:alterColumn —— #15 已统一,compareScalar 纯标量漏检 bug 已修(见 .claude-tasks/TODO-compareScalar-scalar-diff-bug.md),
  // 且 createMigrateBuilder Proxy 已补数组返回收集(mssql alterColumn 返回语句数组)。
  it('[P0] alterColumn 修改列可空性', async () => {
    await cli.update('AlterMigrate');
    const schema = (await cli.getDbSchema())!;
    const parent = table(schema, 'BuilderParent');
    const name = parent.columns.find(c => c.name === 'name')!;
    assert.strictEqual(name.isNullable, true, 'alterColumn 后 name 列应为可空');
  });

  it('[P0] dropIndex / dropForeignKey / dropColumn(up 方向)', async () => {
    await cli.update('DropMigrate');
    const schema = (await cli.getDbSchema())!;
    const child = table(schema, 'BuilderChild');
    assert(!child.indexes.find(i => i.name === 'IX_Child_Code'), 'dropIndex 后索引应不存在');
    assert(!child.foreignKeys.find(fk => fk.name === 'FK_Child_Parent'), 'dropForeignKey 后外键应不存在');
    assert(!child.columns.find(c => c.name === 'code'), 'dropColumn 后 code 列应不存在');
  });

  it('[P0] update down 回滚撤销', async () => {
    // 回滚 DropMigrate(down 恢复索引/外键/列)
    await cli.update('CreateMigrate');
    const schema = (await cli.getDbSchema())!;
    const child = table(schema, 'BuilderChild');
    assert(child.indexes.find(i => i.name === 'IX_Child_Code'), 'down 后索引应恢复');
    assert(child.foreignKeys.find(fk => fk.name === 'FK_Child_Parent'), 'down 后外键应恢复');
    assert(child.columns.find(c => c.name === 'code'), 'down 后 code 列应恢复');
  });

});
