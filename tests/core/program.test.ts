import { Connection, SQL, DbType } from "lubejs/core";
import assert from "assert";
import { connectToEmptyDb } from "tests/util";

describe("tests/core/program.test.ts", function () {
  this.timeout(0);
  let db: Connection;
  before(async function () {
    db = await connectToEmptyDb({
      config: "CoreTest",
    });
  });

  after(async function () {
    await db.close();
  });

  it("if ... elseif ... else ...", async () => {
    const sql1 = SQL.if(SQL.literal(1).eq(1))
      .then(
        SQL.select({
          result: 1,
        })
      )
      .elseif(SQL.literal(1).eq(2))
      .then(
        SQL.select({
          result: 2,
        })
      )
      .else(
        SQL.select({
          result: 3,
        })
      );
    const { rows: rows1 } = await db.query(sql1);
    assert(rows1[0]?.result === 1);

    const sql2 = SQL.if(SQL.literal(2).eq(1))
      .then(
        SQL.select({
          result: 1,
        })
      )
      .elseif(SQL.literal(2).eq(2))
      .then(
        SQL.select({
          result: 2,
        })
      )
      .else(
        SQL.select({
          result: 3,
        })
      );
    const { rows: rows2 } = await db.query(sql2);
    assert(rows2[0]?.result === 2);

    const sql3 = SQL.if(SQL.literal(3).eq(1))
      .then(
        SQL.select({
          result: 1,
        })
      )
      .elseif(SQL.literal(3).eq(2))
      .then(
        SQL.select({
          result: 2,
        })
      )
      .else(
        SQL.select({
          result: 3,
        })
      );
    const { rows: rows3 } = await db.query(sql3);
    assert(rows3[0]?.result === 3);
  });

  it("set <variant> = ...", async () => {
    const $i = SQL.var<number>("i", DbType.int32);
    const sql = SQL.declare($i).as(
      SQL.set($i, 100),
      SQL.select({
        result: $i,
      })
    );
    const { rows } = await db.query(sql);
    assert(rows?.[0]?.result === 100);
  });

  it("while ... do", async () => {
    const $i = SQL.var<number>("i", DbType.int32);
    const sql = SQL.declare($i).as(
      SQL.set($i, 1),
      SQL.while($i.lte(10)).do(
        SQL.set($i, $i.add(1)),
        SQL.if($i.gte(5)).then(SQL.break())
      ),
      SQL.select({
        result: $i,
      })
    );
    const { rows } = await db.query(sql);
    assert(rows?.[0]?.result === 5);
  });
});
