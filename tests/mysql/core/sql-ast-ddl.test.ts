import { DbProvider, DbType, SQL } from 'lubejs';
import { driver } from 'lubejs-mysql';
import assert from 'assert';

/**
 * MySQL 离线 DDL 单元测试 —— 仅用 mysql Sqlifier 生成 SQL 文本做断言，
 * 不依赖数据库连接，可在 CI 无 DB 环境运行。
 */
describe('MySQL AST DDL (offline) ———— tests/mysql/core/sql-ast-ddl.test.ts', function () {
  const db: DbProvider = driver();
  const { table, select } = SQL;

  function sqlify(cmd: any): string {
    return (db.sqlifier.sqlify(cmd) as any).sql as string;
  }

  describe('CREATE TABLE', () => {
    it('AUTO_INCREMENT 主键、notNull', () => {
      const sql = sqlify(
        SQL.createTable('T1').as(({ column }) => [
          column('id', DbType.int32).identity().primaryKey(),
          column('name', DbType.string(100)).notNull(),
          column('age', DbType.int32).null(),
        ])
      );
      assert(sql.startsWith('CREATE TABLE `T1`'), sql);
      assert(sql.includes('`id` INT AUTO_INCREMENT PRIMARY KEY'), sql);
      assert(sql.includes('`name` VARCHAR(100) NOT NULL'), sql);
    });

    it('唯一键与外键约束', () => {
      const sql = sqlify(
        SQL.createTable('T2').as(({ column, foreignKey, uniqueKey }) => [
          column('id', DbType.int64).primaryKey().identity(),
          column('pid', DbType.int64).notNull(),
          column('code', DbType.string(32)),
          foreignKey('fk_t2_t1').reference('T1', ['id']).on(['pid']),
          uniqueKey('uk_t2_code').on(['code']),
        ])
      );
      assert(sql.includes('PRIMARY KEY'), sql);
      assert(sql.includes('FOREIGN KEY'), sql);
      assert(sql.includes('REFERENCES'), sql);
      assert(sql.includes('UNIQUE'), sql);
    });
  });

  describe('CREATE INDEX', () => {
    it('唯一索引用反引号', () => {
      const sql = sqlify(
        SQL.createIndex('ix_t2_code').on('T2', ['code']).unique()
      );
      assert(sql.startsWith('CREATE UNIQUE INDEX `ix_t2_code`'), sql);
      assert(sql.includes('ON `T2`(`code` ASC)'), sql);
    });
  });

  describe('CREATE VIEW', () => {
    it('CREATE VIEW 用反引号', () => {
      const sql = sqlify(
        SQL.createView('V1').as(select(table('T1').star).from('T1'))
      );
      assert(sql.startsWith('CREATE VIEW `V1` AS'), sql);
      assert(sql.includes('SELECT `T1`.* FROM `T1`'), sql);
    });
  });

  describe('DROP / ALTER', () => {
    it('DROP TABLE IF EXISTS', () => {
      const sql = sqlify(SQL.dropTable.ifExists('T1'));
      assert.strictEqual(sql, 'DROP TABLE IF EXISTS `T1`');
    });

    it('ALTER TABLE DROP COLUMN', () => {
      const sql = sqlify(SQL.alterTable('T1').dropColumn('age'));
      assert(sql.startsWith('ALTER TABLE `T1`'), sql);
      assert(sql.includes('DROP') && sql.includes('COLUMN `age`'), sql);
    });
  });
});
