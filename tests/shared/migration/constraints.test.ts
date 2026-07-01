import assert from 'assert';
import { DB } from '@orm';
import {
  MigrateCli,
  DbContext,
  DatabaseSchema,
  Connection,
  createConnection,
  getConnectionOptions,
  createContext,
} from 'lubejs';

describe('DDL 约束 [P0]', function () {
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

  function table(name: string) {
    const t = dbSchema.tables.find(t => t.name === name);
    assert(t, `表 ${name} 应存在`);
    return t;
  }

  it('[P0] 主键 PK', () => {
    const user = table('User');
    assert(user.primaryKey, 'User 应有主键');
    const pkCols = user.primaryKey!.columns.map(c => c.name);
    assert(pkCols.includes('id'), `User 主键应含 id,实际: ${pkCols.join(', ')}`);
  });

  // sqlite 不支持 ALTER TABLE ADD CONSTRAINT,core sync 两步法的第二步(后加 FK)失效;
  // FK 需建表时内联,后加/删除需 12 步表重建(留作后续)。skip for sqlite。
  (process.env.LUBEJS_TEST_DRIVER === 'sqlite' ? it.skip : it)('[P0] 外键 FK OrderDetail → Order', () => {
    const detail = table('OrderDetail');
    const fk = detail.foreignKeys.find(
      fk => fk.referenceTable === 'Order' && fk.columns.includes('orderId')
    );
    assert(fk, `OrderDetail 应有引用 Order(orderId) 的外键,实际: ${JSON.stringify(detail.foreignKeys)}`);
    assert(fk!.referenceColumns.includes('id'), '外键引用列应含 Order.id');
  });

  // sqlite 不支持 ALTER TABLE ADD CONSTRAINT(同上),skip for sqlite。
  (process.env.LUBEJS_TEST_DRIVER === 'sqlite' ? it.skip : it)('[P0] 外键 FK Employee → User', () => {
    const emp = table('Employee');
    const fk = emp.foreignKeys.find(
      fk => fk.referenceTable === 'User' && fk.columns.includes('userId')
    );
    assert(fk, `Employee 应有引用 User(userId) 的外键,实际: ${JSON.stringify(emp.foreignKeys)}`);
  });
});
