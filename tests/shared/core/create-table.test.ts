import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection } from '../../util';

describe('SQL.createTable', function () {
  const db = getProvider();

  it('[P0] 基本建表 - 生成文本', function () {
    const ast = SQL.createTable('t_create_table_basic').as(({ column }) => [
      column('id', DbType.int32).identity(1, 1).primaryKey(),
      column('name', DbType.string(100)).notNull(),
      column('age', DbType.int32).null(),
      column('createdAt', DbType.datetime).null(),
    ]);
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('CREATE TABLE'), sql);
    assert(sql.includes(adapter.quote('id')), sql);
    assert(sql.includes(adapter.quote('name')), sql);
    assert(sql.includes(adapter.quote('age')), sql);
    assert(sql.includes(adapter.quote('createdAt')), sql);
    assert(sql.includes('PRIMARY KEY'), sql);
  });

  it('[P0] 带主键 - 生成文本', function () {
    const ast = SQL.createTable('t_create_table_pk').as(({ column }) => [
      column('id', DbType.int32).identity(1, 1).primaryKey(),
      column('name', DbType.string(100)).notNull(),
    ]);
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('CREATE TABLE'), sql);
    assert(sql.includes('PRIMARY KEY'), sql);
    if (adapter.driver === 'mssql') {
      assert(sql.includes('IDENTITY'), sql);
    }
  });
});

describe('SQL.createTable (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
  });

  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] 基本建表 - 执行', async function () {
    const tableName = 't_create_table_basic_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));

      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).primaryKey(),
          column('name', DbType.string(100)).notNull(),
          column('age', DbType.int32).null(),
        ])
      );

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ id: 1, name: 'test', age: 20 }));
      const result = await conn.query(SQL.select(t.star).from(t));
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].name, 'test');
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });

  it('[P0] 带主键自增 - 执行', async function () {
    const tableName = 't_create_table_pk_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));

      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).identity(1, 1).primaryKey(),
          column('name', DbType.string(100)).notNull(),
        ])
      );

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ name: 'test1' }));
      await conn.query(SQL.insert(t).values({ name: 'test2' }));
      const result = await conn.query(SQL.select(t.star).from(t));

      assert.strictEqual(result.rows.length, 2);
      assert(result.rows[0].id != null, 'id should be auto-assigned');
      assert(result.rows[1].id != null, 'id should be auto-assigned');
      if (result.rows[0].id != null && result.rows[1].id != null) {
        assert.notStrictEqual(result.rows[0].id, result.rows[1].id, 'ids should be different');
      }
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });
});
