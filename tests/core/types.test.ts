import { Connection, DbType, SQL, Time } from 'lubejs/core';
import assert from 'power-assert';
import { connectToEmptyDb } from 'tests/util';

describe.only('tests/core/types.test.ts ———— DbType Test', function () {
  this.timeout(0);
  let db: Connection;
  before(async function () {
    db = await connectToEmptyDb({
      config: 'mssql-core-test',
    });
  });

  it('string', async () => {
    // sql传入
    const sql = SQL.select({
      str: 'hello world',
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].str === 'hello world');

    const p = SQL.input('s', 'hello world');
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        str: p,
      })
    );
    assert(res2.rows[0].str === 'hello world');
  });

  it('boolean', async () => {
    // sql传入
    const sql = SQL.select({
      t: true,
      f: false,
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].t === true);
    assert(res1.rows[0].f === false);

    const t = SQL.input('t', true);
    const f = SQL.input('f', false);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        t,
        f,
      })
    );
    assert(res2.rows[0].t === true);
    assert(res2.rows[0].f === false);
  });

  it('int8', async () => {
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(8).to(DbType.int8),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === 8);

    const f1 = SQL.input('f1', DbType.int8, 8);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === 8);
  });

  it('int16', async () => {
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(16).to(DbType.int16),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === 16);

    const f1 = SQL.input('f1', DbType.int16, 16);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === 16);
  });

  it('int32', async () => {
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(32).to(DbType.int32),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === 32);

    const f1 = SQL.input('f1', DbType.int32, 32);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === 32);
  });

  it('int64', async () => {
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(64n),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === 64n);

    const f1 = SQL.input('f1', DbType.int64, 64n);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === 64n);
  });

  it('float', async () => {
    const pi = Math.PI;
    // sql传入
    const sql = SQL.select({
      f1: pi,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === pi);

    const f1 = SQL.input('f1', DbType.float, pi);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === pi);
  });

  it('double', async () => {
    const value = Number.MAX_VALUE;
    // sql传入
    const sql = SQL.select({
      f1: value,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === value);

    const f1 = SQL.input('f1', DbType.double, value);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === value);
  });

  it('date', async () => {
    const value = new Date(2020, 1, 1);
    // sql传入
    const sql = SQL.select({
      f1: value,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === value);

    const f1 = SQL.input('f1', DbType.date, value);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === value);
  });

  it('time', async () => {
    const value = new Time(12, 0, 0);
    // sql传入
    const sql = SQL.select({
      f1: value,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === value);

    const f1 = SQL.input('f1', DbType.time, value);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === value);
  });

  it('datetime', async () => {
    const value = new Date(2020, 1, 1, 12, 0, 0);
    const expect = new Date(value.getTime());
    expect.setMinutes(expect.getMinutes() + value.getTimezoneOffset());
    // sql传入
    const sql = SQL.select({
      f1: value,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === expect);

    const f1 = SQL.input('f1', DbType.datetime, value);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === value);
  });

  it('datetimeoffset', async () => {
    const value = new Date(2020, 1, 1, 12, 0, 0);
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(value, DbType.datetimeoffset),
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === value);

    const f1 = SQL.input('f1', DbType.datetimeoffset, value);
    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(res2.rows[0].f1 === value);
  });

  it('binary', async () => {
    const value = Buffer.from('Hello world!');
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(value),
    });

    const res1 = await db.query(sql);

    assert(Buffer.compare(res1.rows[0].f1, value) === 0);

    const f1 = SQL.input('f1', DbType.binary(DbType.MAX), value);

    // 参数传入
    const res2 = await db.query(
      SQL.select({
        f1,
      })
    );
    assert(Buffer.compare(res2.rows[0].f1 as any, value) === 0);
  });

  it('uuid', async () => {});

  it('object', async () => {});

  it('array', async () => {});

  it('rowflag', async () => {});
});
