import assert from 'assert';
import { SQL, DbType, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection } from '../../util';

describe('SQL.createIndex', function () {
  const db = getProvider();

  it('[P0] 普通索引 - 生成文本', function () {
    const ast = SQL.createIndex('ix_test_code').on('t_index_test', ['code']);
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('CREATE INDEX'), sql);
    assert(!sql.includes('UNIQUE'), sql);
    assert(sql.includes(adapter.quote('ix_test_code')), sql);
    assert(sql.includes(adapter.quote('t_index_test')), sql);
    assert(sql.includes(adapter.quote('code')), sql);
  });

  it('[P0] 唯一索引 - 生成文本', function () {
    const ast = SQL.createIndex('ix_test_code_unique').on('t_index_test', ['code']).unique();
    const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

    assert(sql.includes('CREATE'), sql);
    assert(sql.includes('UNIQUE'), sql);
    assert(sql.includes('INDEX'), sql);
  });
});

describe('SQL.createIndex (integration)', function () {
  let conn: import('lubejs').Connection;

  before(async function () {
    conn = await getCoreConnection();
  });

  after(async function () {
    if (conn) await conn.close();
  });

  it('[P0] 普通索引 - 执行', async function () {
    const tableName = 't_index_basic_int';
    const indexName = 'ix_test_code_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));
      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).primaryKey(),
          column('code', DbType.string(100)),
          column('name', DbType.string(100)),
        ])
      );

      await conn.query(SQL.createIndex(indexName).on(tableName, ['code']));

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ id: 1, code: 'c1', name: 'n1' }));
      await conn.query(SQL.insert(t).values({ id: 2, code: 'c1', name: 'n2' }));

      const result = await conn.query(SQL.select(t.star).from(t));
      assert.strictEqual(result.rows.length, 2);
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });

  it('[P0] 唯一索引 - 执行', async function () {
    const tableName = 't_index_unique_int';
    const indexName = 'ix_test_code_unique_int';

    try {
      await conn.query(SQL.dropTable.ifExists(tableName));
      await conn.query(
        SQL.createTable(tableName).as(({ column }) => [
          column('id', DbType.int32).primaryKey(),
          column('code', DbType.string(100)),
        ])
      );

      await conn.query(SQL.createIndex(indexName).on(tableName, ['code']).unique());

      const t = SQL.table(tableName);
      await conn.query(SQL.insert(t).values({ id: 1, code: 'c1' }));
      const result = await conn.query(SQL.select(t.star).from(t));
      assert.strictEqual(result.rows.length, 1);
    } finally {
      await conn.query(SQL.dropTable.ifExists(tableName));
    }
  });
});
