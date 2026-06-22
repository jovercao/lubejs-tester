import { DbProvider, DbType, SQL } from 'lubejs';
import { driver } from 'lubejs-mssql';
import assert from 'assert';

/**
 * 离线 DML / SELECT 单元测试 —— 仅用 mssql Sqlifier 生成 SQL 文本做断言，
 * 不依赖数据库连接，可在 CI 无 DB 环境运行。
 *
 * 断言采用子串/特征匹配，聚焦语义关键片段。
 */
describe('AST DML/SELECT (offline) ———— tests/core/sql-ast-dml.test.ts', function () {
  const db: DbProvider = driver();
  const { select, table, insert, update, delete: del } = SQL;

  function sqlify(cmd: any): { sql: string; params: any[] } {
    const r: any = db.sqlifier.sqlify(cmd);
    return { sql: r.sql as string, params: r.params as any[] };
  }

  describe('INSERT', () => {
    it('单行 VALUES', () => {
      const { sql } = sqlify(insert('T1').values({ name: 'a', age: 1 }));
      assert(sql.startsWith('INSERT INTO [T1]'), sql);
      assert(sql.includes('([name], [age])'), sql);
      assert(sql.includes('VALUES'), sql);
      assert(sql.includes("N'a'"), sql);
      assert(sql.includes(', 1'), sql);
    });

    it('批量 VALUES', () => {
      const { sql } = sqlify(
        insert('T1').values([
          { name: 'a', age: 1 },
          { name: 'b', age: 2 },
        ])
      );
      // 批量插入应产出两组值
      const valuesCount = (sql.match(/\), \(/g) || []).length;
      assert.strictEqual(valuesCount, 1, sql);
      assert(sql.includes("N'a'"), sql);
      assert(sql.includes("N'b'"), sql);
    });
  });

  describe('UPDATE', () => {
    it('SET ... WHERE', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(
        update(t).set({ age: 5 }).where(t.name.eq('a'))
      );
      assert(sql.startsWith('UPDATE [t] SET'), sql);
      assert(sql.includes('[t].[age] = 5'), sql);
      assert(sql.includes('FROM [T1] AS [t]'), sql);
      assert(sql.includes("WHERE [t].[name] = N'a'"), sql);
    });
  });

  describe('DELETE', () => {
    it('DELETE ... WHERE', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(del(t).where(t.name.eq('a')));
      assert(sql.startsWith('DELETE [t]'), sql);
      assert(sql.includes("WHERE [t].[name] = N'a'"), sql);
    });
  });

  describe('SELECT', () => {
    it('JOIN + WHERE + ORDER BY', () => {
      const t = table('T1').as('t');
      const t2 = table('T2').as('t2');
      const { sql } = sqlify(
        select({ id: t.id, name: t.name })
          .from(t)
          .join(t2, t.id.eq(t2.id))
          .where(t.age.gt(0))
          .orderBy(t.id.asc())
      );
      assert(sql.includes('SELECT [t].[id] AS [id], [t].[name] AS [name]'), sql);
      assert(sql.includes('FROM [T1] AS [t]'), sql);
      assert(sql.includes('JOIN [T2] AS [t2] ON [t].[id] = [t2].[id]'), sql);
      assert(sql.includes('WHERE [t].[age] > 0'), sql);
      assert(sql.includes('ORDER BY [t].[id] ASC'), sql);
    });

    it('LEFT JOIN', () => {
      const t = table('T1').as('t');
      const t2 = table('T2').as('t2');
      const { sql } = sqlify(
        select(t.star).from(t).leftJoin(t2, t.id.eq(t2.id))
      );
      assert(sql.includes('LEFT JOIN [T2] AS [t2]'), sql);
    });

    it('GROUP BY + HAVING', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(
        select({ cnt: SQL.count(t.id), age: t.age })
          .from(t)
          .groupBy(t.age)
          .having(SQL.count(t.id).gte(1))
      );
      assert(sql.includes('GROUP BY [t].[age]'), sql);
      assert(sql.includes('HAVING count([t].[id]) >= 1'), sql);
    });

    it('UNION ALL', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(select(t.star).from(t).unionAll(select(t.star).from(t)));
      assert(sql.includes('UNION ALL'), sql);
      // 两段 SELECT
      assert.strictEqual((sql.match(/SELECT/g) || []).length, 2, sql);
    });

    it('DISTINCT', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(select({ id: t.id }).from(t).distinct());
      assert(sql.includes('SELECT DISTINCT'), sql);
    });

    it('CASE WHEN', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(
        select({ lv: SQL.case(t.age).when(1, 'one').else('other') }).from(t)
      );
      assert(sql.includes('CASE [t].[age] WHEN 1 THEN'), sql);
      assert(sql.includes("ELSE N'other' END"), sql);
    });

    it('IN 列表', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(select(t.star).from(t).where(t.id.in([1, 2, 3])));
      assert(sql.includes('WHERE [t].[id] IN (1,2,3)'), sql);
    });

    it('EXISTS 子查询', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(
        select(t.star).from(t).where(SQL.exists(select(1).from(t)))
      );
      assert(sql.includes('EXISTS('), sql);
    });

    it('OFFSET / FETCH (需 ORDER BY)', () => {
      const t = table('T1').as('t');
      const { sql } = sqlify(select(t.star).from(t).offset(10).limit(20));
      assert(sql.includes('OFFSET 10 ROWS'), sql);
      assert(sql.includes('FETCH NEXT 20 ROWS ONLY'), sql);
    });

    it('and/or 嵌套条件', () => {
      const sql = sqlify(
        select(1).where(
          SQL.and(
            SQL.literal(1).eq(1),
            SQL.or(SQL.literal(2).eq(2), SQL.literal(3).eq(3))
          )
        )
      ).sql;
      assert(sql.includes('WHERE (1 = 1 AND (2 = 2 OR 3 = 3))'), sql);
    });
  });

  describe('参数化', () => {
    it('SQL.input 产出命名参数', () => {
      const t = table('T1').as('t');
      const { params } = sqlify(
        select(t.star).from(t).where(t.name.eq(SQL.input('p', 'x')))
      );
      assert(params && params.length === 1, JSON.stringify(params));
      assert.strictEqual(params[0].name, 'p');
    });
  });
});
