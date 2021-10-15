/* eslint-disable @typescript-eslint/no-explicit-any */
import { Binary, Connection, DbType, isBinary, Literal, RowObjectFrom, SQL, Time, Uuid } from 'lubejs/core';
import assert from 'assert';
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
      expr: 'hello world',
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].expr === 'hello world');

    const i = SQL.input('s', 'in: hello world');
    const o = SQL.output('o', DbType.string, 'out: hello ');
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, SQL.concat(o, 'lili')),
        SQL.select({
          input: i,
          output: o,
        })
      )
    );
    assert(res2.rows[0].input === 'in: hello world');
    assert(res2.rows[0].output === 'out: hello lili');
    assert(res2.output!.o === 'out: hello lili');
    assert(o.value === 'out: hello lili');
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

    const i_t = SQL.input('it', true);
    const i_f = SQL.input('if', false);
    const o = SQL.output('o', DbType.boolean, false);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, true),
        SQL.select({
          input_t: i_t,
          input_f: i_f,
          output: o,
        })
      )
    );
    assert(typeof res2.rows[0].input === 'boolean');
    assert(o.value === true);
    assert(res2.output!.o === true);
    assert(res2.rows[0].input_t === true);
    assert(res2.rows[0].input_f === false);
  });

  it('int8', async () => {
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(8).to(DbType.int8),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].expr === 8);

    const i = SQL.input('i', DbType.int8, 8);
    const o = SQL.output('o', DbType.int8, 8);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, o.add(i)),
        SQL.select({
          input: i,
          output: o,
        })
      )
    );
    assert(typeof res2.rows[0].input === 'number');
    assert(res2.output!.o === 16);
    assert(o.value === 16);
    assert(res2.rows[0].input === 8);
    assert(res2.rows[0].output === 16);
  });

  it('int16', async () => {
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(16).to(DbType.int16),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].expr === 16);

    const i = SQL.input('i', DbType.int16, 16);
    const o = SQL.output('o', DbType.int16, 16);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, o.add(i)),
        SQL.select({
          input: i,
          output: o,
        })
      )
    );
    assert(typeof res2.rows[0].input === 'number');
    assert(res2.rows[0].input === 16);
    assert(res2.rows[0].output === 32);
    assert(res2.output!.o === 32);
    assert(o.value === 32);
  });

  it('int32', async () => {
    // sql传入
    const sql = SQL.select({
      f1: SQL.literal(32).to(DbType.int32),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].f1 === 32);

    const i = SQL.input('i', DbType.int32, 32);
    const o = SQL.output('o', DbType.int32, 32);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, o.add(i)),
        SQL.select({
          input: i,
          output: o,
        })
      )
    );

    assert(typeof res2.rows[0].input === 'number');
    assert(res2.rows[0].input === 32);
    assert(res2.rows[0].output === 64);
    assert(res2.output!.o === 64);
    assert(o.value === 64);
  });

  it('int64', async () => {
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(64n),
    });
    const res1 = await db.query(sql);
    assert(res1.rows[0].expr === 64n);

    const i = SQL.input('i', DbType.int64, 64n);
    const o = SQL.output('o', DbType.int64, 64n);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, o.add(i)),
        SQL.select({
          f1: i,
        })
      )
    );
    assert(res2.rows[0].input === 64n);
    assert(res2.rows[0].output === 128n);
    assert(res2.output!.o === 128n);
    assert(o.value === 128n);
  });

  it('float32', async () => {
    const value = Math.PI;
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(value, DbType.float32),
    });

    const res1 = await db.query(sql);
    assert(typeof res1.rows[0].expr === 'number');
    assert(res1.rows[0].expr.toFixed(6) === value.toFixed(6));

    const i = SQL.input('i', DbType.float32, value);
    const o = SQL.output('o', DbType.float32, value);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, o.add(i)),
        SQL.select({
          input: i,
        })
      )
    );
    const expectOutput = (value + value).toFixed(6);
    assert(typeof res2.rows[0].input === 'number');
    assert(res2.rows[0].input.toFixed(6) === value.toFixed(6));
    assert(res2.rows[0].output.toFixed(6) === value.toFixed(6));
    assert((res2.output!.o as number).toFixed(6) === expectOutput);
    assert((o.value as number).toFixed(6) === expectOutput);
  });

  it('float64', async () => {
    const value = Number.MAX_VALUE - 1;
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(value, DbType.float64),
    });

    const res1 = await db.query(sql);
    assert(typeof res1.rows[0].expr === 'number');
    assert(res1.rows[0].expr.toFixed(6) === value.toFixed(6));

    const i = SQL.input('i', DbType.float64, value);
    const o = SQL.output('o', DbType.float64, value);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, o.add(i)),
        SQL.select({
          input: i,
        })
      )
    );
    const expectOutput = (value + value).toFixed(6);
    assert(typeof res2.rows[0].input === 'number');
    assert(res2.rows[0].input.toFixed(6) === value.toFixed(6));
    assert(res2.rows[0].output.toFixed(6) === value.toFixed(6));
    assert((res2.output!.o as number).toFixed(6) === expectOutput);
    assert((o.value as number).toFixed(6) === expectOutput);
  });

  it('date', async () => {
    const value = new Date(2020, 0, 1);
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(value, DbType.date),
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].expr instanceof Date);
    assert(res1.rows[0].expr.getTime() === value.getTime());

    const i = SQL.input('i', DbType.date, value);
    const o = SQL.output('o', DbType.date, value);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, SQL.std.addDays(o, 1)),
        SQL.select({
          input: i,
        })
      )
    );
    const expectOutput = new Date(value);
    expectOutput.setDate(value.getDate() + 1);

    assert(res2.rows[0].input instanceof Date);
    assert(res2.rows[0].input.getTime() === value.getTime());
    assert(res2.rows[0].output.getTime() === expectOutput.getTime());
    assert((res2.output!.o as Date).getTime() === expectOutput.getTime());
    assert((o.value as Date).getTime() === expectOutput.getTime());
  });

  it.only('time', async () => {
    const value = new Time(12, 0, 0);
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(value, DbType.time),
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].expr instanceof Time);
    assert(res1.rows[0].expr.valueOf() === value.valueOf());

    const i = SQL.input('i', DbType.time, value);
    const o = SQL.output('o', DbType.time, value);

    const expectOutput = new Time('13:00:00');
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, expectOutput),
        SQL.select({
          input: i,
        })
      )
    );

    assert(res2.rows[0].input instanceof Date);
    assert(res2.rows[0].input.valueOf() === value.valueOf());
    assert(res2.rows[0].output.valueOf() === expectOutput.valueOf());
    assert((res2.output!.o as Time).valueOf() === expectOutput.valueOf());
    assert((o.value as Time).valueOf() === expectOutput.valueOf());
  });

  it('datetime', async () => {
    const value = new Date(2020, 0, 1);
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(value, DbType.datetime),
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].expr instanceof Date);
    assert(res1.rows[0].expr.getTime() === value.getTime());

    const i = SQL.input('i', DbType.datetime, value);
    const o = SQL.output('o', DbType.datetime, value);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, SQL.std.addDays(o, 1)),
        SQL.select({
          input: i,
        })
      )
    );
    const expectOutput = new Date(value);
    expectOutput.setDate(value.getDate() + 1);

    assert(res2.rows[0].input instanceof Date);
    assert(res2.rows[0].input.getTime() === value.getTime());
    assert(res2.rows[0].output.getTime() === expectOutput.getTime());
    assert((res2.output!.o as Date).getTime() === expectOutput.getTime());
    assert((o.value as Date).getTime() === expectOutput.getTime());
  });

  it('datetimeoffset', async () => {
    const value = new Date(2020, 0, 1);
    // sql传入
    const sql = SQL.select({
      expr: SQL.literal(value, DbType.datetimeoffset),
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].expr instanceof Date);
    assert(res1.rows[0].expr.getTime() === value.getTime());

    const i = SQL.input('i', DbType.datetimeoffset, value);
    const o = SQL.output('o', DbType.datetimeoffset, value);
    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, SQL.std.addDays(o, 1)),
        SQL.select({
          input: i,
        })
      )
    );
    const expectOutput = new Date(value);
    expectOutput.setDate(value.getDate() + 1);

    assert(res2.rows[0].input instanceof Date);
    assert(res2.rows[0].input.getTime() === value.getTime());
    assert(res2.rows[0].output.getTime() === expectOutput.getTime());
    assert((res2.output!.o as Date).getTime() === expectOutput.getTime());
    assert((o.value as Date).getTime() === expectOutput.getTime());
  });

  it('binary', async () => {
    const value = Buffer.from('Hello world!');
    // sql传入
    const sql = SQL.select({
      expr: value,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].expr instanceof Date);
    assert(Buffer.compare(res1.rows[0].expr, value) === 0);

    const i = SQL.input('i', DbType.binary, value);
    const o = SQL.output('o', DbType.binary, value);
    const expectOutput = Buffer.from('Hello Jover!');

    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, expectOutput),
        SQL.select({
          input: i,
        })
      )
    );

    assert(isBinary(res2.rows[0].input));
    assert(Buffer.compare(res2.rows[0].input, value) === 0);
    assert(Buffer.compare(res2.rows[0].output, expectOutput) === 0);
    assert(Buffer.compare(Buffer.from(res2.output!.o as any), expectOutput) === 0);
    assert(Buffer.compare(Buffer.from(o.value!), expectOutput) === 0);
  });

  it('uuid', async () => {
    const value = Uuid.new();
    // sql传入
    const sql = SQL.select({
      expr: value,
    });

    const res1 = await db.query(sql);
    assert(res1.rows[0].expr instanceof Uuid);
    assert(Uuid.equals(res1.rows[0].expr, value));

    const i = SQL.input('i', DbType.uuid, value);
    const o = SQL.output('o', DbType.uuid, value);
    const expectOutput = Uuid.new();

    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, expectOutput),
        SQL.select({
          input: i,
        })
      )
    );

    assert(res2.rows[0].input instanceof Uuid);
    assert(Uuid.equals(res2.rows[0].input, value));
    assert(Uuid.equals(res2.rows[0].output, expectOutput));
    assert(Uuid.equals(res2.output!.o as Uuid, expectOutput));
    assert(Uuid.equals(o.value!, expectOutput));
  });

  it('json', async () => {
    const value = {
      a: 1,
      b: 2,
      c: 3
    };

    // sql传入
    const sql = SQL.select({
      expr: value,
    });

    const res1 = await db.query(sql);
    const data = JSON.parse(res1.rows[0].expr as any);
    assert(typeof data === 'object');
    assert.strictEqual(data, value);

    const i = SQL.input('i', DbType.json<typeof value>(), value);
    const o = SQL.output('o', DbType.json<typeof value>(), value);
    const expectOutput = {
      a: 3,
      b: 2,
      c: 1
    };

    // 参数传入
    const res2 = await db.query(
      SQL.block(
        SQL.set(o, expectOutput),
        SQL.select({
          input: i,
        })
      )
    );

    assert(res2.rows[0].input instanceof Uuid);
    assert(Uuid.equals(res2.rows[0].input, value));
    assert(Uuid.equals(res2.rows[0].output, expectOutput));
    assert(Uuid.equals(res2.output!.o as Uuid, expectOutput));
    assert(Uuid.equals(o.value!, expectOutput));
  });

  it('array', async () => {});

  it('rowflag', async () => {});
});
