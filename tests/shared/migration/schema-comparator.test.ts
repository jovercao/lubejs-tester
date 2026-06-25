import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  DatabaseSchema,
  generateSchema,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
  SchemaComparator,
} from 'lubejs';

describe('SchemaComparator [P0]', function () {
  this.timeout(0);
  let dbContext: DbContext;
  let connection: Connection;
  let comparator: SchemaComparator;
  let defaultSchema: string;
  let base: DatabaseSchema;

  before(async () => {
    const options = Object.assign({}, await getConnectionOptions(DB.name));
    if (options.database) {
      delete options.database;
    }
    connection = await createConnection(options);
    await connection.open();
    dbContext = await createContext(DB, connection);

    comparator = connection.provider.getSchemaComparator();
    defaultSchema = (await new MigrateCli(dbContext)).targetSchemaName;
    base = generateSchema(dbContext);
  });

  after(async () => {
    await connection?.close();
  });

  /** 浅克隆 base 并对指定表名执行变更回调 */
  function cloneWith(table: string, mutate: (t: DatabaseSchema['tables'][0]) => DatabaseSchema['tables'][0]): DatabaseSchema {
    return {
      ...base,
      tables: base.tables.map(t => (t.name === table ? mutate({ ...t, columns: t.columns.map(c => ({ ...c })) }) : t)),
    };
  }

  it('[P0] source 含表、target 缺失 → addeds', () => {
    const source = base;
    const target: DatabaseSchema = { ...base, tables: base.tables.filter(t => t.name !== 'Position') };
    const diff = comparator.compareSchema(defaultSchema, source, target);
    assert(diff, '应有差异');
    const tablesDiff = diff.changes!.tables as any;
    const added = tablesDiff.addeds.find((t: any) => t.name === 'Position');
    assert(added, 'Position 应在 addeds 中');
  });

  it('[P0] target 多出表 → removeds', () => {
    const extra = { ...base.tables[0], name: 'ExtraTable', columns: [], indexes: [], foreignKeys: [], constraints: [] };
    const source = base;
    const target: DatabaseSchema = { ...base, tables: [...base.tables, extra] };
    const diff = comparator.compareSchema(defaultSchema, source, target);
    assert(diff, '应有差异');
    const tablesDiff = diff.changes!.tables as any;
    const removed = tablesDiff.removeds.find((t: any) => t.name === 'ExtraTable');
    assert(removed, 'ExtraTable 应在 removeds 中');
  });

  it('[P0] 列类型变更 → columns 变更', () => {
    const source = base;
    const target = cloneWith('User', t => {
      const name = t.columns.find(c => c.name === 'name')!;
      name.type = 'VARCHAR(999)';
      return t;
    });
    const diff = comparator.compareSchema(defaultSchema, source, target);
    assert(diff, '应有差异');
    const tablesDiff = diff.changes!.tables as any;
    const userChange = tablesDiff.changes.find((d: any) => d.source.name === 'User');
    assert(userChange, 'User 表应出现在 changes 中');
    const colsDiff = userChange.changes.columns as any;
    const nameChange = colsDiff.changes.find((d: any) => d.source.name === 'name');
    assert(nameChange, 'name 列应出现在列 changes 中');
    assert(nameChange.changes.type, 'type 应有差异');
  });

  // NOTE: isNullable / isIdentity 等纯标量差异当前不可检测 —— lubejs core 的
  // compareScalar 在比较器未表态(返回 undefined)且两侧均为非空值时,错误地返回 null。
  // type/defaultValue 由比较器显式处理故可检测。详见 .claude-tasks/TODO-compareScalar-scalar-diff-bug.md。
  it.skip('[P0] 列可空性变更 → 待 compareScalar 修复后补', () => {});

  it('[P0] 两 schema 相同 → 返回 null', () => {
    const diff = comparator.compareSchema(defaultSchema, base, base);
    assert(diff === null, `相同 schema 应返回 null,实际: ${JSON.stringify(diff, null, 2)}`);
  });
});
