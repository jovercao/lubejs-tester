import { Connection, SQL, DbType } from "lubejs/core";
import assert from "assert";
import { connectToEmptyDb } from "tests/util";

describe("Program Statement ———— tests/core/program.test.ts", function () {
  this.timeout(0);
  let db: Connection;
  before(async function () {
    db = await connectToEmptyDb({
      config: "mssql-core-test",
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
    const sql = SQL.declare($i).body(
      $i.set(100),
      SQL.select({
        result: $i,
      })
    );
    const { rows } = await db.query(sql);
    assert(rows?.[0]?.result === 100);
  });

  it("while ... do", async () => {
    const $i = SQL.var<number>("i", DbType.int32);
    const sql = SQL.declare($i).body(
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

  it("table variant", async () => {
    const $t = SQL.table("t", [
      SQL.createTable.column("id", DbType.int32).primaryKey().identity(),
      SQL.createTable.column("name", DbType.string(100)).notNull(),
      SQL.createTable.column("value", DbType.string(DbType.MAX)),
    ]);
    const sql = SQL.declare($t).body(
      SQL.insert($t).values([
        {
          name: "item1",
          value: "this is item1",
        },
        {
          name: "item2",
          value: "this is item2",
        },
      ]),
      SQL.delete($t).where($t.name.eq("item2")),
      SQL.update($t).set({ value: "this is updated item1" }),
      SQL.select($t.star).from($t)
    );

    const { rows } = await db.query(sql);
    assert(
      rows.length === 1 &&
        rows[0]?.name === "item1" &&
        rows[0]?.value === "this is updated item1"
    );
  });
});
