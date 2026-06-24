/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbType, Expression, SQL } from 'lubejs';
import type { DialectAdapter } from './index';

export const mssqlAdapter: DialectAdapter = {
  driver: 'mssql',
  quote: (name) => `[${name}]`,
  now: () => SQL.now() as Expression,
  typeName: (dbType: DbType) => {
    switch (dbType.type) {
      case 'INT32':
        return 'INT';
      case 'INT64':
        return 'BIGINT';
      case 'STRING':
        return 'NVARCHAR(255)';
      case 'DECIMAL':
        return 'DECIMAL(18,2)';
      case 'DATETIME':
        return 'DATETIME';
      default:
        return 'NVARCHAR(255)';
    }
  },
  expect: {
    'union.basic':
      'SELECT [t1].* FROM [t1] UNION SELECT [t2].* FROM [t2]',
    'unionAll.basic':
      'SELECT [t1].* FROM [t1] UNION ALL SELECT [t2].* FROM [t2]',
    'select.basic':
      'SELECT [t1].[a] AS [a], [t1].[b] AS [b] FROM [t1]',
    'select.alias':
      'SELECT [t1].[a] AS [id] FROM [t1]',
    'select.star':
      'SELECT [t1].* FROM [t1]',
    'insert.single':
      "INSERT INTO [t1]([a], [b]) VALUES(1, N'x')",
    'insert.multi':
      "INSERT INTO [t1]([a], [b]) VALUES(1, N'x'), (2, N'y')",
    'update.basic':
      "UPDATE [t1] SET [t1].[b] = N'z'",
    'update.multi':
      "UPDATE [t1] SET [t1].[a] = 1, [t1].[b] = N'y'",
    'update.cond':
      "UPDATE [t1] SET [t1].[b] = N'z' WHERE [t1].[a] = 1",
    'delete.cond':
      'DELETE [t1] WHERE [t1].[a] = 1',
    'predicates.like':
      "SELECT [t1].* FROM [t1] WHERE [t1].[b] LIKE N'%x%'",
    'predicates.in':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] IN (1,2,3)',
    'predicates.isNull':
      'SELECT [t1].* FROM [t1] WHERE [t1].[b] IS NULL',
    'predicates.isNotNull':
      'SELECT [t1].* FROM [t1] WHERE [t1].[b] IS NOT NULL',
    'join.inner':
      'SELECT [t1].[a] AS [a], [t2].[b] AS [b] FROM [t1] JOIN [t2] ON [t1].[a] = [t2].[t1id]',
    'group-order.group':
      'SELECT [t1].[a] AS [a], count([t1].[b]) AS [#column_1] FROM [t1] GROUP BY [t1].[a]',
    'group-order.order':
      'SELECT [t1].[a] AS [a] FROM [t1] ORDER BY [t1].[a] ASC',
    'aggregate.count':
      'SELECT count([t1].[a]) AS [#column_1] FROM [t1]',
    'aggregate.sum':
      'SELECT sum([t1].[a]) AS [#column_1] FROM [t1]',
    'pagination.top':
      'SELECT TOP 2 [t1].[a] AS [a] FROM [t1]',
    'pagination.limitOffset':
      'SELECT [t1].[a] AS [a] FROM [t1] ORDER BY 1 OFFSET 1 ROWS FETCH NEXT 2 ROWS ONLY',
    'arithmetic.add':
      'SELECT [t1].[a] + 1 AS [r] FROM [t1]',
    'arithmetic.sub':
      'SELECT [t1].[a] - 1 AS [r] FROM [t1]',
    'arithmetic.mul':
      'SELECT [t1].[a] * 2 AS [r] FROM [t1]',
    'arithmetic.div':
      'SELECT [t1].[a] / 2 AS [r] FROM [t1]',
    'arithmetic.mod':
      'SELECT [t1].[a] % 3 AS [r] FROM [t1]',
    'comparison.eq':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] = 1',
    'comparison.neq':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] <> 1',
    'comparison.lt':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] < 5',
    'comparison.lte':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] <= 5',
    'comparison.gt':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] > 5',
    'comparison.gte':
      'SELECT [t1].* FROM [t1] WHERE [t1].[a] >= 5',
    'comparison.and':
      "SELECT [t1].* FROM [t1] WHERE ([t1].[a] = 1 AND [t1].[b] = N'x')",
    'comparison.or':
      'SELECT [t1].* FROM [t1] WHERE ([t1].[a] = 1 OR [t1].[a] = 2)',
    'case-when.simple':
      "SELECT CASE WHEN [t1].[a] = 1 THEN N'one' WHEN [t1].[a] = 2 THEN N'two' ELSE N'other' END AS [label] FROM [t1]",
    'literals.const':
      'SELECT 1 AS [c] FROM [t1]',
    'literals.field':
      'SELECT [a] AS [a] FROM [t1]',
    'literals.table':
      'SELECT [t1].* FROM [t1]',
    'subquery.exists':
      'SELECT [t1].[a] AS [a] FROM [t1] WHERE EXISTS(SELECT [t2].[a] AS [a] FROM [t2] WHERE [t2].[a] = [t1].[a])',
  },
};
