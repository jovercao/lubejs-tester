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
  },
};
