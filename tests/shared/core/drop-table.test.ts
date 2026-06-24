import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection } from '../../util';

describe('SQL.dropTable', function () {
  const db = getProvider();

  it('[P0] dropTable - 生成文本', function () {
    const ast = SQL.dropTable('t_drop_table_basic');
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('DROP TABLE'), sql);
    assert(sql.includes(adapter.quote('t_drop_table_basic')), sql);
  });

  it('[P0] dropTable.ifExists - 生成文本', function () {
    const ast = SQL.dropTable.ifExists('t_drop_table_ifexists');
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('DROP TABLE'), sql);
    assert(sql.includes(adapter.quote('t_drop_table_ifexists')), sql);
  });
});

describe('SQL.dropTable (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
  });

  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] dropTable - 执行', async function () {
    const tableName = 't_drop_table_basic_int';

    await conn.query(SQL.dropTable.ifExists(tableName));
    await conn.query(
      SQL.createTable(tableName).as(({ column }) => [
        column('id', DbType.int32).primaryKey(),
        column('name', DbType.string(100)),
      ])
    );

    const t = SQL.table(tableName);
    await conn.query(SQL.insert(t).values({ id: 1, name: 'test' }));

    await conn.query(SQL.dropTable(tableName));

    try {
      await conn.query(SQL.select(t.star).from(t));
      assert.fail('Query should have thrown an error after table was dropped');
    } catch (err) {
      assert(err, 'Expected an error after dropping table');
    }
  });

  it('[P0] dropTable.ifExists - 执行', async function () {
    const tableName = 't_drop_table_ifexists_int';

    await conn.query(SQL.dropTable.ifExists(tableName));
    await conn.query(
      SQL.createTable(tableName).as(({ column }) => [
        column('id', DbType.int32).primaryKey(),
      ])
    );

    await conn.query(SQL.dropTable.ifExists(tableName));
    await conn.query(SQL.dropTable.ifExists(tableName));
  });
});
