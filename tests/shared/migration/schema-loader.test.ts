import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
  SchemaLoader,
} from 'lubejs';
import { adapter } from '../../dialect';

describe('SchemaLoader [P0]', function () {
  this.timeout(0);
  let cli: MigrateCli;
  let dbContext: DbContext;
  let connection: Connection;
  let loader: SchemaLoader;
  let targetDatabase: string;
  // 粒度查询的 schema:mssql 为 'dbo'(=cli.targetSchemaName);mysql 中 TABLE_SCHEMA 即库名
  let schema: string;

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
    schema = adapter.driver === 'mysql' ? targetDatabase : cli.targetSchemaName;

    await cli.dropTargetDatabase();
    await cli.sync();
    await connection.changeDatabase(cli.targetDatabase);

    loader = connection.provider.getSchemaLoader(connection);
  });

  after(async () => {
    await connection?.close();
  });

  it('[P0] getDatabaseSchema 加载库结构含已 sync 的表', async () => {
    const dbSchema = await loader.getDatabaseSchema(targetDatabase);
    assert(dbSchema, 'getDatabaseSchema 应返回结构');
    const tableNames = dbSchema.tables.map(t => t.name);
    for (const name of ['User', 'Order', 'OrderDetail', 'Employee', 'Organization', 'Position']) {
      assert(tableNames.includes(name), `库结构应含表 ${name},实际: ${tableNames.join(', ')}`);
    }
  });

  it('[P0] getTables/getColumns 加载表与列结构', async () => {
    const tables = await loader.getTables(targetDatabase, schema);
    const user = tables.find(t => t.name === 'User');
    assert(user, 'getTables 应返回 User 表');

    const columns = await loader.getColumns(targetDatabase, schema, 'User');
    const colNames = columns.map(c => c.name);
    assert(colNames.includes('id'), 'User 表应含 id 列');
    assert(colNames.includes('name'), 'User 表应含 name 列');
    assert(colNames.includes('password'), 'User 表应含 password 列');
  });
});
