import { DbProvider, DbType, SQL } from 'lubejs';
import { driver } from 'lubejs-mysql';
import assert from 'assert';

/**
 * MySQL 离线 DML/SELECT 单元测试 —— 仅用 mysql Sqlifier 生成 SQL 文本做断言，
 * 不依赖数据库连接。
 */
describe('MySQL AST DML/SELECT (offline) ———— tests/mysql/core/sql-ast-dml.test.ts', function () {
  const db: DbProvider = driver();
  const { select, table, insert, update, delete: del } = SQL;

  function sqlify(cmd: any): { sql: string; params: any[] } {
    const r: any = db.sqlifier.sqlify(cmd);
    return { sql: r.sql as string, params: r.params as any[] };
  }

  describe('INSERT', () => {
    it('单行 VALUES，字符串用单引号(无 N 前缀)', () => {
      const { sql } = sqlify(insert('T1').values({ name: 'a', age: 1 }));
      assert(sql.startsWith('INSERT INTO `T1`'), sql);
      assert(sql.includes('VALUES'), sql);
      assert(sql.includes("'a'"), sql);
      assert(!sql.includes("N'a'"), '字符串不应有 N 前缀: ' + sql);
    });

    it('批量 VALUES', () => {
      const { sql } = sqlify(
        insert('T1').values([
          { name: 'a', age: 1 },
          { name: 'b', age: 2 },
        ])
      );
      const valuesCount = (sql.match(/\), \(/g) || []).length;
      assert.strictEqual(valuesCount, 1, sql);
      assert(sql.includes("'a'"), sql);
      assert(sql.includes("'b'"), sql);
    });
  });

  describe('SELECT', () => {
    it('JOIN + WHERE + ORDER BY 用反引号', () => {
      const t = table('T1').as('t');
      const t2 = table('T2').as('t2');
      const { sql } = sqlify(
        select({ id: t.id, name: t.name })
          .from(t)
          .join(t2, t.id.eq(t2.id))
          .where(t.age.gt(0))
          .orderBy(t.id.asc())
      );
      assert(sql.includes('SELECT `t`.`id` AS `id`'), sql);
      assert(sql.includes('FROM `T1` AS `t`'), sql);
      assert(sql.includes('JOIN `T2` AS `t2` ON `t`.`id` = `t2`.`id`'), sql);
      assert(sql.includes('WHERE `t`.`age` > 0'), sql);
      assert(sql.includes('ORDER BY `t`.`id` ASC'), sql);
    });

    it('GROUP BY + HAVING', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(
        select({ cnt: SQL.count(t.id), age: t.age })
          .from(t)
          .groupBy(t.age)
          .having(SQL.count(t.id).gte(1))
      );
      assert(sql.includes('GROUP BY `t`.`age`'), sql);
      assert(sql.includes('HAVING count(`t`.`id`) >= 1'), sql);
    });

    it('LIMIT offset, count', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(select(t.star).from(t).offset(10).limit(20));
      assert(sql.includes('LIMIT 10, 20'), sql);
    });

    it('CASE WHEN', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(
        select({ lv: SQL.case(t.age).when(1, 'one').else('other') }).from(t)
      );
      assert(sql.includes('CASE `t`.`age` WHEN 1 THEN'), sql);
      assert(sql.includes("ELSE 'other' END"), sql);
    });

    it('IN 列表', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(select(t.star).from(t).where(t.id.in([1, 2, 3])));
      assert(sql.includes('WHERE `t`.`id` IN (1,2,3)'), sql);
    });
  });
});
