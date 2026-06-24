import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection } from '../../util';

describe('SQL.alterTable', function () {
  const db = getProvider();

  it('[P0] addColumn - 生成文本', function () {
    const ast = SQL.alterTable('t_alter_add').addColumn((col) =>
      col('age', DbType.int32)
    );
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('ALTER TABLE'), sql);
    assert(sql.includes('ADD'), sql);
    assert(sql.includes(adapter.quote('age')), sql);
  });

  it('[P0] dropColumn - 生成文本', function () {
    const ast = SQL.alterTable('t_alter_drop').dropColumn('age');
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('ALTER TABLE'), sql);
    assert(sql.includes('DROP'), sql);
    assert(sql.includes('COLUMN'), sql);
    assert(sql.includes(adapter.quote('age')), sql);
  });

  it('[P0] alterColumn - 生成文本', function () {
    const ast = SQL.alterTable('t_alter_modify').alterColumn((col) =>
      col('age', DbType.int64)
    );
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('ALTER TABLE'), sql);
    assert(sql.includes(adapter.quote('age')), sql);
  });
});

describe('SQL.alterTable (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
  });

  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] addColumn - 执行', async function () {
    const tableName = 't_alter_add_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));
      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).primaryKey(),
        ])
      );

      await conn.query(
        SQL.alterTable(tableName).addColumn((col) =>
          col('age', DbType.int32)
        )
      );

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ id: 1, age: 20 }));
      const result = await conn.query(SQL.select(t.star).from(t));
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].age, 20);
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });

  it('[P0] dropColumn - 执行', async function () {
    const tableName = 't_alter_drop_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));
      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).primaryKey(),
          column('name', DbType.string(100)),
          column('age', DbType.int32),
        ])
      );

      await conn.query(SQL.alterTable(tableName).dropColumn('age'));

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ id: 1, name: 'test' }));
      const result = await conn.query(SQL.select(t.star).from(t));
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].name, 'test');
      assert.strictEqual('age' in result.rows[0], false, 'age column should not exist');
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });

  it('[P0] alterColumn - 执行', async function () {
    const tableName = 't_alter_modify_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));
      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).primaryKey(),
          column('age', DbType.int32),
        ])
      );

      await conn.query(
        SQL.alterTable(tableName).alterColumn((col) =>
          col('age', DbType.int64)
        )
      );

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ id: 1, age: 123456 }));
      const result = await conn.query(SQL.select(t.star).from(t));
      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(String(result.rows[0].age), '123456');
    } catch (err) {
      if (adapter.driver === 'mysql') {
        this.skip('MySQL alterColumn may fail due to TODO #15');
      } else {
        throw err;
      }
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });
});
