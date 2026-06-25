import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  DatabaseSchema,
  ColumnSchema,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
} from 'lubejs';

describe('DDL 列属性 [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let targetDatabase: string;
  let dbSchema: DatabaseSchema;

  before(async () => {
    const options = Object.assign({}, await getConnectionOptions(DB.name));
    targetDatabase = options.database || 'lubejs-orm-test';
    if (options.database) {
      delete options.database;
    }
    connection = await createConnection(options);
    await connection.open();
    await connection.changeToSysdb();
    dbContext = await createContext(DB, connection);

    cli = await new MigrateCli(dbContext);
    cli.targetDatabase = targetDatabase;

    await cli.dropTargetDatabase();
    await cli.sync();
    await connection.changeDatabase(cli.targetDatabase);

    dbSchema = (await cli.getDbSchema())!;
    assert(dbSchema, 'getDbSchema 应返回结构');
  });

  after(async () => {
    await connection?.close();
  });

  function column(table: string, name: string): ColumnSchema {
    const t = dbSchema.tables.find(t => t.name === table);
    assert(t, `表 ${table} 应存在`);
    const c = t.columns.find(c => c.name === name);
    assert(c, `列 ${table}.${name} 应存在`);
    return c;
  }

  it('[P0] identity 自增列', () => {
    const id = column('User', 'id');
    assert.strictEqual(id.isIdentity, true, 'User.id 应为 identity');
    const name = column('User', 'name');
    assert.strictEqual(name.isIdentity, false, 'User.name 不应为 identity');
  });

  it('[P0] notnull / nullable', () => {
    assert.strictEqual(column('User', 'id').isNullable, false, 'User.id 不可空');
    assert.strictEqual(column('User', 'name').isNullable, false, 'User.name 不可空');
    assert.strictEqual(column('User', 'password').isNullable, true, 'User.password 可空');
  });

  it('[P0] default 默认值', () => {
    const date = column('Order', 'date');
    assert(typeof date.defaultValue === 'string' && date.defaultValue.length > 0,
      `Order.date 应有默认值,实际: ${JSON.stringify(date.defaultValue)}`);
  });

  // 注:decorator 模式实体不产出列 comment(CLAUDE.md: decorator 不产出 comment),
  // 故 comment(P2)不在本 P0 用例中断言;configure 模式下可另测。
});
