/* eslint-disable @typescript-eslint/no-explicit-any */
import { DbType, Expression, SQL } from 'lubejs';
import type { DialectAdapter } from './index';

export const mysqlAdapter: DialectAdapter = {
  driver: 'mysql',
  quote: (name) => '`' + name + '`',
  now: () => SQL.now() as Expression,
  typeName: (dbType: DbType) => {
    switch (dbType.type) {
      case 'INT32':
        return 'INT';
      case 'INT64':
        return 'BIGINT';
      case 'STRING':
        return 'VARCHAR(255)';
      case 'DECIMAL':
        return 'DECIMAL(18,2)';
      case 'DATETIME':
        return 'DATETIME';
      default:
        return 'VARCHAR(255)';
    }
  },
  expect: {
    'union.basic':
      'SELECT `t1`.* FROM `t1` UNION SELECT `t2`.* FROM `t2`',
    'unionAll.basic':
      'SELECT `t1`.* FROM `t1` UNION ALL SELECT `t2`.* FROM `t2`',
    'select.basic':
      'SELECT `t1`.`a` AS `a`, `t1`.`b` AS `b` FROM `t1`',
    'select.alias':
      'SELECT `t1`.`a` AS `id` FROM `t1`',
    'select.star':
      'SELECT `t1`.* FROM `t1`',
    'insert.single':
      "INSERT INTO `t1`(`a`, `b`) VALUES(1, 'x')",
    'insert.multi':
      "INSERT INTO `t1`(`a`, `b`) VALUES(1, 'x'), (2, 'y')",
    'update.basic':
      "UPDATE `t1` SET `t1`.`b` = 'z'",
    'update.multi':
      "UPDATE `t1` SET `t1`.`a` = 1, `t1`.`b` = 'y'",
    'update.cond':
      "UPDATE `t1` SET `t1`.`b` = 'z' WHERE `t1`.`a` = 1",
    'delete.cond':
      'DELETE FROM `t1` WHERE `t1`.`a` = 1',
    'predicates.like':
      "SELECT `t1`.* FROM `t1` WHERE `t1`.`b` LIKE '%x%'",
    'predicates.in':
      'SELECT `t1`.* FROM `t1` WHERE `t1`.`a` IN (1,2,3)',
    'predicates.isNull':
      'SELECT `t1`.* FROM `t1` WHERE `t1`.`b` IS NULL',
    'predicates.isNotNull':
      'SELECT `t1`.* FROM `t1` WHERE `t1`.`b` IS NOT NULL',
    'join.inner':
      'SELECT `t1`.`a` AS `a`, `t2`.`b` AS `b` FROM `t1` JOIN `t2` ON `t1`.`a` = `t2`.`t1id`',
    'group-order.group':
      'SELECT `t1`.`a` AS `a`, count(`t1`.`b`) AS `#column_1` FROM `t1` GROUP BY `t1`.`a`',
    'group-order.order':
      'SELECT `t1`.`a` AS `a` FROM `t1` ORDER BY `t1`.`a` ASC',
    'aggregate.count':
      'SELECT count(`t1`.`a`) AS `#column_1` FROM `t1`',
    'aggregate.sum':
      'SELECT sum(`t1`.`a`) AS `#column_1` FROM `t1`',
    'pagination.top':
      'SELECT `t1`.`a` AS `a` FROM `t1` LIMIT 2',
    'pagination.limitOffset':
      'SELECT `t1`.`a` AS `a` FROM `t1` LIMIT 1, 2',
  },
};
