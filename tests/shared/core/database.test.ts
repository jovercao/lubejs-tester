import assert from 'assert';
import { SQL, SqlCommand } from 'lubejs';
import { adapter, getProvider } from '../../dialect';
import { getCoreConnection } from '../../util';

describe('SQL.createDatabase / dropDatabase', function () {
  const db = getProvider();

  if (adapter.driver === 'sqlite') {
    it('[P0] createDatabase - 生成文本', function () {
      // SQLite doesn't support CREATE/DROP DATABASE
      this.skip();
    });

    it('[P0] dropDatabase - 生成文本', function () {
      // SQLite doesn't support CREATE/DROP DATABASE
      this.skip();
    });

    it('[P0] dropDatabase.ifExists - 生成文本', function () {
      // SQLite doesn't support CREATE/DROP DATABASE
      this.skip();
    });
  } else {
    it('[P0] createDatabase - 生成文本', function () {
      const ast = SQL.createDatabase('lubejs_ddl_test');
      const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

      assert(sql.includes('CREATE DATABASE'), sql);
      assert(sql.includes('lubejs_ddl_test'), sql);
    });

    it('[P0] dropDatabase - 生成文本', function () {
      const ast = SQL.dropDatabase('lubejs_ddl_test');
      const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

      assert(sql.includes('DROP DATABASE'), sql);
      assert(sql.includes('lubejs_ddl_test'), sql);
    });

    it('[P0] dropDatabase.ifExists - 生成文本', function () {
      const ast = SQL.dropDatabase.ifExists('lubejs_ddl_test');
      const sql = (db.sqlifier.sqlify(ast) as SqlCommand).sql;

      assert(sql.includes('DROP DATABASE'), sql);
      assert(sql.includes('lubejs_ddl_test'), sql);
    });
  }
});

describe('Database operations (integration)', function () {
  let conn: import('lubejs').Connection;

  if (adapter.driver === 'sqlite') {
    it('[P0] changeDatabase - 执行', function () {
      // SQLite doesn't support database switching
      this.skip();
    });
  } else {
    before(async function () {
      conn = await getCoreConnection();
    });

    after(async function () {
      if (conn) {
        try { await conn.close(); } catch {}
      }
    });

    it('[P0] changeDatabase - 执行', async function () {
      const dbName = 'lubejs_change_db_test';

      try {
        await conn.query(SQL.dropDatabase.ifExists(dbName));
        await conn.query(SQL.createDatabase(dbName));
        await conn.changeDatabase(dbName);
      } finally {
        try { await conn.query(SQL.dropDatabase.ifExists(dbName)); } catch {}
      }
    });
  }
});
