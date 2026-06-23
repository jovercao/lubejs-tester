import { DbProvider, DbType, SQL } from 'lubejs';
import { driver } from 'lubejs-mssql';
import assert from 'assert';

/**
 * 离线 DDL 单元测试 —— 仅用 mssql Sqlifier 生成 SQL 文本做断言，
 * 不依赖数据库连接，可在 CI 无 DB 环境运行。
 *
 * 断言采用子串/特征匹配，聚焦语义关键片段，避免被格式细节（空白、
 * 列顺序）绑死而变得脆弱。
 */
describe('AST DDL (offline) ———— tests/core/sql-ast-ddl.test.ts', function () {
  const db: DbProvider = driver();
  const { table, select } = SQL;

  function sqlify(cmd: any): string {
    return (db.sqlifier.sqlify(cmd) as any).sql as string;
  }

  describe('CREATE TABLE', () => {
    it('基础列定义：identity 主键、notNull、null', () => {
      const sql = sqlify(
        SQL.createTable('T1').as(({ column }) => [
          column('id', DbType.int32).identity(1, 1).primaryKey(),
          column('name', DbType.string(100)).notNull(),
          column('age', DbType.int32).null(),
        ])
      );
      assert(sql.startsWith('CREATE TABLE [T1]'), sql);
      assert(sql.includes('[id] INT IDENTITY(1, 1) PRIMARY KEY'), sql);
      assert(sql.includes('[name] VARCHAR(100) NOT NULL'), sql);
      assert(sql.includes('[age] INT NULL'), sql);
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
      assert(sql.includes('FOREIGN KEY([pid])'), sql);
      assert(sql.includes('REFERENCES [T1]([id])'), sql);
      assert(sql.includes('UNIQUE([code]'), sql);
    });

    it('默认值与行版本标记', () => {
      const sql = sqlify(
        SQL.createTable('T3').as(({ column }) => [
          column('id', DbType.int32).identity().primaryKey(),
          column('createdAt', DbType.datetime).default(SQL.now()),
          column('flag', DbType.rowflag),
        ])
      );
      assert(sql.includes('DEFAULT'), sql);
      assert(sql.includes('TIMESTAMP'), sql);
    });
  });

  describe('CREATE INDEX', () => {
    it('唯一索引', () => {
      const sql = sqlify(
        SQL.createIndex('ix_t2_code').on('T2', ['code']).unique()
      );
      assert(sql.startsWith('CREATE UNIQUE INDEX [ix_t2_code]'), sql);
      assert(sql.includes('ON [T2]([code] ASC)'), sql);
    });

    it('非唯一索引', () => {
      const sql = sqlify(SQL.createIndex('ix_t2_code').on('T2', ['code']));
      assert(!sql.includes('UNIQUE'), sql);
      assert(sql.includes('ON [T2]([code] ASC)'), sql);
    });
  });

  describe('CREATE VIEW / ALTER VIEW', () => {
    it('CREATE VIEW', () => {
      const sql = sqlify(
        SQL.createView('V1').as(select(table('T1').star).from('T1'))
      );
      assert(sql.startsWith('CREATE VIEW [V1] AS'), sql);
      assert(sql.includes('SELECT [T1].* FROM [T1]'), sql);
    });
  });

  describe('CREATE SEQUENCE', () => {
    it('类型、起始值、步长', () => {
      const sql = sqlify(
        SQL.createSequence('Seq1')
          .as(DbType.int32)
          .startWith(1)
          .incrementBy(1)
      );
      assert(sql.startsWith('CREATE SEQUENCE [Seq1]'), sql);
      assert(sql.includes('AS INT'), sql);
      assert(sql.includes('START WITH 1'), sql);
      assert(sql.includes('INCREMENT BY 1'), sql);
    });
  });

  describe('CREATE FUNCTION / PROCEDURE', () => {
    it('CREATE FUNCTION 返回标量', () => {
      const sql = sqlify(
        SQL.createFunction('fn1')
          .params()
          .returns(DbType.int32)
          .as(SQL.return(SQL.literal(1)))
      );
      assert(sql.includes('CREATE FUNCTION'), sql);
      assert(sql.includes('[fn1]'), sql);
      assert(sql.includes('RETURNS INT'), sql);
      assert(sql.includes('RETURN'), sql);
    });

    it('CREATE PROCEDURE', () => {
      const sql = sqlify(
        SQL.createProcedure('sp1').as(SQL.return(SQL.literal(1)))
      );
      assert(sql.includes('CREATE PROCEDURE'), sql);
      assert(sql.includes('[sp1]'), sql);
    });
  });

  describe('DROP / ALTER', () => {
    it('DROP TABLE IF EXISTS', () => {
      const sql = sqlify(SQL.dropTable.ifExists('T1'));
      assert(sql.includes('OBJECT_ID'), sql);
      assert(sql.includes('DROP TABLE [T1]'), sql);
    });

    it('DROP VIEW', () => {
      const sql = sqlify(SQL.dropView('V1'));
      assert(sql.includes('DROP VIEW [V1]'), sql);
    });

    it('ALTER TABLE DROP COLUMN', () => {
      const sql = sqlify(SQL.alterTable('T1').dropColumn('age'));
      assert(sql.startsWith('ALTER TABLE [T1]'), sql);
      assert(sql.includes('DROP') && sql.includes('COLUMN [age]'), sql);
    });
  });
});
