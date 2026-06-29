import assert from 'assert';
import { DbType, Statement, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';

/**
 * alterColumn identity 四态专项用例（spec §8）。
 *
 * 离线断言 MigrateBuilder.alterColumn 在 identity 四态下生成的 DDL 文本：
 * - mssql: add/drop → RAISERROR 附指引（对齐 EF Core，不支持自动重建/侧迁）；
 *   reseed → DBCC CHECKIDENT；undefined（不变）→ 不发 identity 语句。
 * - mysql: add/reseed/keep → MODIFY ... AUTO_INCREMENT；drop → 无 AUTO_INCREMENT；
 *   reseed 额外 ALTER TABLE ... AUTO_INCREMENT = n。
 *
 * 不连库，仅验证 DDL 生成正确性。
 */
describe('alterColumn identity 四态 [P0]', function () {
  const db = getProvider();
  const mb = db.getMigrateBuilder();
  const sqlifier = (db as any).sqlifier;

  function sqlify(ret: any): string[] {
    const arr = Array.isArray(ret) ? ret : [ret];
    return arr.map((s) => (sqlifier.sqlify(s) as SqlCommand).sql);
  }

  function alter(action: 'add' | 'reseed' | 'drop' | 'keep'): string[] {
    const ret = mb.alterColumn('t_id', (g: any) => {
      const c = g('id', DbType.int32);
      if (action === 'add') {
        c.identity(100, 1);
      } else if (action === 'drop') {
        c.dropIdentity();
      } else if (action === 'reseed') {
        c.$identityAction = 'reseed';
        c.$identitySeed = { startValue: 100, increment: 1 };
      }
      // keep: 不设任何 identity 字段
      return c;
    });
    return sqlify(ret);
  }

  if (adapter.driver === 'mssql') {
    it('[P0] add identity → RAISERROR（不支持自动加 identity）', () => {
      const sqls = alter('add');
      const all = sqls.join('\n');
      assert(
        all.includes('RAISERROR'),
        `mssql add identity 应发 RAISERROR，实际: ${all}`
      );
      assert(/加 identity/.test(all), `应附"加 identity"指引，实际: ${all}`);
    });

    it('[P0] drop identity → RAISERROR（不支持自动去 identity）', () => {
      const sqls = alter('drop');
      const all = sqls.join('\n');
      assert(
        all.includes('RAISERROR'),
        `mssql drop identity 应发 RAISERROR，实际: ${all}`
      );
      assert(/去 identity/.test(all), `应附"去 identity"指引，实际: ${all}`);
    });

    it('[P0] reseed → DBCC CHECKIDENT', () => {
      const sqls = alter('reseed');
      const all = sqls.join('\n');
      assert(
        /DBCC\s+CHECKIDENT/i.test(all),
        `mssql reseed 应发 DBCC CHECKIDENT，实际: ${all}`
      );
      assert(all.includes('100'), `DBCC 应含种子值 100，实际: ${all}`);
    });

    it('[P0] keep（不变）→ 不发 identity 语句', () => {
      const sqls = alter('keep');
      const all = sqls.join('\n');
      assert(
        !/RAISERROR|DBCC\s+CHECKIDENT/i.test(all),
        `mssql identity 不变不应发 RAISERROR/DBCC，实际: ${all}`
      );
    });
  }

  if (adapter.driver === 'mysql') {
    it('[P0] add identity → MODIFY ... AUTO_INCREMENT', () => {
      const sqls = alter('add');
      const all = sqls.join('\n');
      assert(
        /AUTO_INCREMENT/i.test(all),
        `mysql add identity 应含 AUTO_INCREMENT，实际: ${all}`
      );
    });

    it('[P0] drop identity → MODIFY 无 AUTO_INCREMENT', () => {
      const sqls = alter('drop');
      const all = sqls.join('\n');
      assert(
        !/AUTO_INCREMENT/i.test(all),
        `mysql drop identity 不应含 AUTO_INCREMENT，实际: ${all}`
      );
    });

    it('[P0] reseed → AUTO_INCREMENT + AUTO_INCREMENT = n', () => {
      const sqls = alter('reseed');
      const all = sqls.join('\n');
      assert(
        /MODIFY COLUMN.*AUTO_INCREMENT/i.test(all),
        `mysql reseed MODIFY 应含 AUTO_INCREMENT，实际: ${all}`
      );
      assert(
        /AUTO_INCREMENT\s*=\s*100/i.test(all),
        `mysql reseed 应发 AUTO_INCREMENT = 100，实际: ${all}`
      );
    });

    it('[P0] keep（不变，带 $identitySeed）→ MODIFY 保留 AUTO_INCREMENT', () => {
      // scripter 在 identity 不变时设 $identitySeed（无 action），mysql 据此保留 AUTO_INCREMENT
      const ret = mb.alterColumn('t_id', (g: any) => {
        const c = g('id', DbType.int32);
        c.$identitySeed = { startValue: 1, increment: 1 };
        return c;
      });
      const all = sqlify(ret).join('\n');
      assert(
        /AUTO_INCREMENT/i.test(all),
        `mysql identity 不变应保留 AUTO_INCREMENT，实际: ${all}`
      );
    });
  }
});
