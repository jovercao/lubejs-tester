/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbType, Expression, SQL } from 'lubejs';
import type { DialectAdapter } from './index';

/**
 * PostgreSQL 方言适配器。
 *
 * 与 mssql/mysql 的关键差异:
 * - 标识符引用:双引号 "name"(内部 " 转义为 "")
 * - 字符串字面量:单引号 'x'(无 N 前缀,mssql 用 N'x')
 * - 分页:LIMIT N / LIMIT N OFFSET M(pg 语法 LIMIT 在 OFFSET 之前;mysql 用 LIMIT offset,count)
 * - TOP:pg 无 TOP,用 LIMIT N 表达
 * - 函数名引用:"count"/"sum" 等 SQL 函数名在 strict 模式下亦被双引号包裹
 * - UPDATE SET 目标列:不带表名/别名限定(pg 语法 `UPDATE t SET t.col=...` 非法)
 * - DELETE:恒带 FROM(pg 不支持 `DELETE <alias> FROM t AS alias` 多表删除语法)
 * - expect 文本由 gen-pgsql-expect.ts 用 pgsql Sqlifier 实际编译产出,保证与驱动源码一致
 */
export const pgsqlAdapter: DialectAdapter = {
  driver: 'pgsql',
  quote: (name) => '"' + name.replace(/"/g, '""') + '"',
  now: () => SQL.now() as Expression,
  typeName: (dbType: DbType) => {
    switch (dbType.type) {
      case 'INT32':
        return 'INTEGER';
      case 'INT64':
        return 'BIGINT';
      case 'STRING':
        return 'VARCHAR(255)';
      case 'DECIMAL':
        return 'DECIMAL(18,2)';
      case 'DATETIME':
        return 'TIMESTAMP';
      default:
        return 'VARCHAR(255)';
    }
  },
  expect: {
    'union.basic': `SELECT "t1".* FROM "t1" UNION SELECT "t2".* FROM "t2"`,
    'unionAll.basic': `SELECT "t1".* FROM "t1" UNION ALL SELECT "t2".* FROM "t2"`,
    'select.basic': `SELECT "t1"."a" AS "a", "t1"."b" AS "b" FROM "t1"`,
    'select.alias': `SELECT "t1"."a" AS "id" FROM "t1"`,
    'select.star': `SELECT "t1".* FROM "t1"`,
    'insert.single': `INSERT INTO "t1"("a", "b") VALUES(1, 'x')`,
    'insert.multi': `INSERT INTO "t1"("a", "b") VALUES(1, 'x'), (2, 'y')`,
    'update.basic': `UPDATE "t1" SET "b" = 'z'`,
    'update.multi': `UPDATE "t1" SET "a" = 1, "b" = 'y'`,
    'update.cond': `UPDATE "t1" SET "b" = 'z' WHERE "t1"."a" = 1`,
    'delete.cond': `DELETE FROM "t1" WHERE "t1"."a" = 1`,
    'predicates.like': `SELECT "t1".* FROM "t1" WHERE "t1"."b" LIKE '%x%'`,
    'predicates.in': `SELECT "t1".* FROM "t1" WHERE "t1"."a" IN (1,2,3)`,
    'predicates.isNull': `SELECT "t1".* FROM "t1" WHERE "t1"."b" IS NULL`,
    'predicates.isNotNull': `SELECT "t1".* FROM "t1" WHERE "t1"."b" IS NOT NULL`,
    'join.inner': `SELECT "t1"."a" AS "a", "t2"."b" AS "b" FROM "t1" JOIN "t2" ON "t1"."a" = "t2"."t1id"`,
    'group-order.group': `SELECT "t1"."a" AS "a", "count"("t1"."b") AS "#column_1" FROM "t1" GROUP BY "t1"."a"`,
    'group-order.order': `SELECT "t1"."a" AS "a" FROM "t1" ORDER BY "t1"."a" ASC`,
    'aggregate.count': `SELECT "count"("t1"."a") AS "#column_1" FROM "t1"`,
    'aggregate.sum': `SELECT "sum"("t1"."a") AS "#column_1" FROM "t1"`,
    'pagination.top': `SELECT "t1"."a" AS "a" FROM "t1" LIMIT 2`,
    'pagination.limitOffset': `SELECT "t1"."a" AS "a" FROM "t1" LIMIT 2 OFFSET 1`,
    'arithmetic.add': `SELECT "t1"."a" + 1 AS "r" FROM "t1"`,
    'arithmetic.sub': `SELECT "t1"."a" - 1 AS "r" FROM "t1"`,
    'arithmetic.mul': `SELECT "t1"."a" * 2 AS "r" FROM "t1"`,
    'arithmetic.div': `SELECT "t1"."a" / 2 AS "r" FROM "t1"`,
    'arithmetic.mod': `SELECT "t1"."a" % 3 AS "r" FROM "t1"`,
    'comparison.eq': `SELECT "t1".* FROM "t1" WHERE "t1"."a" = 1`,
    'comparison.neq': `SELECT "t1".* FROM "t1" WHERE "t1"."a" <> 1`,
    'comparison.lt': `SELECT "t1".* FROM "t1" WHERE "t1"."a" < 5`,
    'comparison.lte': `SELECT "t1".* FROM "t1" WHERE "t1"."a" <= 5`,
    'comparison.gt': `SELECT "t1".* FROM "t1" WHERE "t1"."a" > 5`,
    'comparison.gte': `SELECT "t1".* FROM "t1" WHERE "t1"."a" >= 5`,
    'comparison.and': `SELECT "t1".* FROM "t1" WHERE ("t1"."a" = 1 AND "t1"."b" = 'x')`,
    'comparison.or': `SELECT "t1".* FROM "t1" WHERE ("t1"."a" = 1 OR "t1"."a" = 2)`,
    'case-when.simple': `SELECT CASE WHEN "t1"."a" = 1 THEN 'one' WHEN "t1"."a" = 2 THEN 'two' ELSE 'other' END AS "label" FROM "t1"`,
    'literals.const': `SELECT 1 AS "c" FROM "t1"`,
    'literals.field': `SELECT "a" AS "a" FROM "t1"`,
    'literals.table': `SELECT "t1".* FROM "t1"`,
    'subquery.exists': `SELECT "t1"."a" AS "a" FROM "t1" WHERE EXISTS(SELECT "t2"."a" AS "a" FROM "t2" WHERE "t2"."a" = "t1"."a")`,
  },
};
