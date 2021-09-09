import assert from 'assert';
import mock from "mockjs";
import _ from "lodash";
import { Connection, connect, SQL, SortObject, Decimal, loadConfig } from "lubejs";

const {
  table,
  field,
  select,
  insert,
  update,
  star: any,
  execute,
  makeInvoke: makeFunc,
  exists,
  input,
  output,
  and,
  group,
  literal: value,
  with: $with,
  type: DbType,
  std: { count, now, identityValue },
} = SQL;

interface IItem {
  FId: number;
  FName: string;
  FAge: number;
  FSex: boolean;
  FCreateDate: Date;
  Flag: ArrayBuffer;
  FParentId: number;
}

const dbName = "lubejs-core-test";

describe("tests/core/crud.test.ts", function () {
  this.timeout(0);
  let db: Connection;
  const sqlLogs = true;
  before(async function () {
    // db = await connect('mssql://sa:!crgd-2019@jover.wicp.net:2443/TEST?poolMin=0&poolMax=5&idelTimeout=30000&connectTimeout=15000&requestTimeout=15000');
    const options = (await loadConfig()).configures['CoreTest'];
    db = await connect(options);
    if (sqlLogs) {
      db.on("command", (cmd) => {
        console.debug("sql:", cmd.sql);
        if (cmd.params && cmd.params.length > 0) {
          console.debug(
            "params: {\n",
            cmd.params
              .map((p) => `${p.name}: ${JSON.stringify(p.value)}`)
              .join(",\n") + "\n}"
          );
        }
      });
    }

    if (
      (await db.queryScalar(
        SQL.select(1).where(SQL.std.existsDatabase(dbName))
      )) === 1
    ) {
      await db.query(SQL.dropDatabase(dbName));
    }

    await db.query(SQL.createDatabase(dbName));
    await db.changeDatabase(dbName);
    await db.query(
      SQL.createFunction("dosomething")
        .params({
          x: DbType.int32,
        })
        .returns(DbType.int32)
        .as([SQL.return(SQL.variant("x"))])
    );

    // await db.query`CREATE PROC doProc(
    //   @i int,
    //   @o nvarchar(20) OUTPUT
    // )
    // AS
    // BEGIN
    //   set @o = 'hello world'
    //   return @i
    // END`;
    await db.query(
      SQL.createProcedure("doProc")
        .params({
          i: DbType.int32,
          o: {
            type: DbType.string(20),
            direction: "OUTPUT",
          },
        })
        .as(
          SQL.assign(SQL.variant("o"), "hello world"),
          SQL.return(SQL.variant("i"))
        )
    );

    await db.query(
      SQL.createTable("Items").as(({ column }) => [
        column("FId", DbType.int32).identity(1, 1).primaryKey(),
        column("FName", DbType.string(120)),
        column("FAge", DbType.boolean),
        column("FSex", DbType.boolean),
        column("FCreateDate", DbType.datetime).default(SQL.std.now()),
        column("Flag", DbType.rowflag),
        column("FParentId", DbType.int32),
      ])
    );

    // await db.query`create table Items (
    //   FId INT IDENTITY(1,1) PRIMARY KEY,
    //   FName NVARCHAR(120),
    //   FAge INT,
    //   FSex BIT,
    //   FCreateDate DATETIME DEFAULT (GETDATE()),
    //   Flag TIMESTAMP NOT NULL,
    //   FParentId INT NULL,
    // )`;
  });

  after(async function () {
    await db.close();
  });

  it("db.query(sql, { p1: value1, p2:value2 })", async function () {
    const rs1 = await db.query("select [Name] = @p1, [Age] = @p2", {
      p1: "name",
      p2: 100,
    });
    assert(rs1.rows[0].Name === "name");
  });

  it("db.query(sqls: string[], ...params)", async function () {
    const name = "Jover";
    const rs2 = await db.query`select [Name] = ${name}, [Age] = ${19}`;
    console.log(rs2);
    assert(rs2.rows[0].Name === name);
  });

  it("db.insert(table, fields: string[], rows: ValueObject[]) --超大数量INSERT", async function () {
    const { rows }: { rows: IItem[] } = mock.mock({
      // 属性 的值是一个数组，其中含有 1 到 10 个元素
      "rows|3001": [
        {
          // 属性 id 是一个自增数，起始值为 1，每次增 1
          // 'FId|+1': 1,
          "FAge|18-60": 1,
          "FSex|0-1": false,
          FName: "@name",
          FCreateDate: new Date(),
        },
      ],
    });

    const lines = await db.insert<IItem>(
      "Items",
      ["FAge", "FSex", "FName", "FCreateDate", "FParentId"],
      rows
    );
    assert(lines === rows.length);
  });

  it("db.insert(table, rows: ValueObject)", async function () {
    const row = mock.mock({
      // 属性 id 是一个自增数，起始值为 1，每次增 1
      // 'FId|+1': 1,
      "FAge|18-60": 1,
      "FSex|0-1": false,
      FName: "@name",
      FCreateDate: new Date(),
    });

    const lines = await db.insert("Items", row);
    assert(lines === 1);
  });

  it("db.insert(table, fields, rows: Expression[])", async function () {
    const lines = await db.insert(
      "Items",
      ["FAge", "FSex", "FName"],
      [18, false, "Lily"]
    );
    assert(lines === 1);
  });

  it("db.insert(table, fields, rows: Expression[][])", async function () {
    const lines = await db.insert(
      "Items",
      ["FAge", "FSex", "FName"],
      [
        [18, false, "Lily"],
        [18, false, "Three Zhang"],
        [18, true, "Lao Wang next door"],
      ]
    );
    assert(lines === 3);
  });

  it("db.query($with(...))", async function () {
    const t = table<IItem>("Items").as("t");
    const x = select(t.star).from(t).where(t.FParentId.isNull()).asWith("x");
    const i = table<IItem>("Items").as("i");
    const y = x.as("y");

    const sql = $with([x])
      .select(y.star)
      .from(y)
      .unionAll(select(i.star).from(i).join(y, i.FParentId.eq(y.FId)));
  });

  it("db.insert(table, rows: Expression[])", async function () {
    let err: Error | undefined;
    try {
      const lines = await db.insert<IItem>("Items", [
        "Lily",
        18,
        false,
        new Date(),
        Buffer.from("abc"),
        null,
      ]);
      assert(lines === 1);
    } catch (e: any) {
      err = e;
    }
    assert(
        err?.message ===
          "Cannot insert an explicit value into a timestamp column. Use INSERT with a column list to exclude the timestamp column, or insert a DEFAULT into the timestamp column.",
      "因为Flag字段原因，该语句必须报错，否则是不正常的"
    );
  });

  it("db.insert(table, fields, rows: Expression[][])", async function () {
    const lines = await db.insert<IItem>(
      "Items",
      ["FName", "FAge", "FSex", "FCreateDate"],
      [
        ["Lily", 18, false, new Date()],
        ["Wang", 18, false, new Date()],
        ["Wang next door", 18, true, new Date()],
      ]
    );
    assert(lines === 3);
  });

  it("db.query(sql: Insert) => @@IDENTITY", async function () {
    const row = mock.mock({
      // 属性 id 是一个自增数，起始值为 1，每次增 1
      // 'FId|+1': 10000,
      "FAge|18-60": 1,
      "FSex|0-1": false,
      FName: "@name",
      FCreateDate: new Date(),
    });
    const t = table<IItem>("Items");
    const sql = insert(t).values(row);
    const { rowsAffected } = await db.query(sql);
    assert(rowsAffected === 1);
    const sql2 = select<IItem>(any)
      .from("Items")
      .where(field("FId").eq(identityValue("Items", "FId")));
    const res2 = await db.query(sql2);
    assert(res2.rows.length > 0);
  });

  it("db.find(condition: WhereObject)", async function () {
    const item = await db.find<IItem>("Items", {
      FId: 1,
    });
    assert(item);
  });

  it("update(rowset, ...)", async function () {
    const rowset = table<IItem>("Items").as("__t__");

    const lines = await db.update(
      rowset,
      {
        FName: "Baoqing Wang",
        FAge: 35,
        FSex: false,
      },
      {
        FId: 1,
      }
    );

    assert(lines === 1);
  });

  it("update(string, ...)", async function () {
    const lines = await db.update<IItem>(
      "Items",
      {
        FName: "LIX",
        FAge: 23,
        FSex: false,
      },
      {
        FId: 1,
      }
    );
    assert(lines === 1);
    const data = await db.find<IItem>("Items", { FId: 1 });
    assert(data?.FName, "LIX");
  });

  it("update statement", async function () {
    const a = table<IItem>("Items");
    const sql = update(a)
      .set({
        FName: "Hello World",
        FAge: 100,
        FSex: true,
      })
      .where(a.FId.eq(2));
    const { rowsAffected } = await db.query(sql);
    assert(rowsAffected === 1);
  });

  it("update statement -> join update", async function () {
    const a = table<IItem>("Items").as("a");
    const b = table<IItem>("Items").as("b");
    const sql = update(a)
      .set({
        FName: "Hello World",
        FAge: 100,
        FSex: true,
      })
      .from(a)
      .join(b, b.FId.eq(a.FId))
      .where(a.FId.eq(2));
    const { rowsAffected } = await db.query(sql);
    assert(rowsAffected === 1);
  });

  it("select", async function () {
    const rows = await db.select<IItem>("Items", {
      where: {
        FId: [1, 10, 11, 12, 13, 14],
      },
      sorts: {
        FId: "ASC",
        FAge: "DESC",
      },
      offset: 0,
      limit: 1,
    });
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].FId, 1);
    assert.strictEqual(rows[0].FSex, false);
  });

  it("db.query(sql: Select) -> GroupBy", async function () {
    const a = table<IItem>("Items").as("a");
    const b = table<IItem>("Items").as("b");

    const x = select<IItem>({
      FId: b.FId,
      FName: b.FName,
      FAge: b.FAge,
      FCreateDate: b.FCreateDate,
      FSex: b.FSex,
      Flag: b.Flag,
    })
      .from(b)
      .as("x");

    const sql = select({
      Sex: SQL.case<string>(a.FSex).when(true, "Man").else("Woman"),
      Now: now(),
      SomeThingResult: makeFunc<number, number>("scalar", {
        name: "dosomething",
        schema: "dbo",
      })(100),
      // 子查询
      field: select(group(1)).asValue(),
      aid: a.FId,
      bid: b.FId,
    })
      .from(a)
      .join(b, a.FId.eq(b.FId))
      .join(x, a.FId.eq(x.FId))
      .where(and(exists(select(1)), x.FId.in(select(b.FId).from(b))))
      .groupBy(a.FId, b.FId, a.FSex)
      .having(count(a.FId).gte(1))
      .offset(50)
      .limit(10)
      .orderBy(a.FId.asc());

    let { rows: rows1 } = await db.query(sql);
    assert(_.isDate(rows1[0].Now), "不是日期类型");
    assert(rows1[0].aid === 51, "数据不是预期结果");
    assert(["Man", "Woman"].includes(rows1[0]["Sex"]), "性别不正确");
    assert(rows1.length === 10, "查询到的数据不正确");

    const sql2 = select(a.FId, a.FSex).from(a).distinct();
    const rows2 = (await db.query(sql2)).rows;
    console.log(rows2[0].FId);
    const sql3 = select({ count: count(any) }).from(a);
    const rows3 = (await db.query(sql3)).rows;
    assert(rows3[0].count > 0);
  });

  it("db.queryScalar(sql: Select)", async function () {
    const t = table<IItem>("Items").as("t");
    const sql = select(count(any)).from(t);

    const records = (await db.queryScalar(sql))!;
    assert(records > 0);
  });

  it("db.query(sql: Select)", async function () {
    const o = table("sysobjects").as("o");
    const p = table({ name: "extended_properties", schema: "sys" }).as("p");
    const sql = select(
      o.id,
      o.name,
      p.value.as("desc"),
      input("inputValue", 1000).as("inputValue")
    )
      .from(o)
      .leftJoin(
        p,
        p.major_id
          .eq(o.id)
          .and(p.minor_id.eq(0))
          .and(p.class.eq(1))
          .and(p.name.eq("MS_Description"))
      )
      .where(o.type.in("U", "V"));
    const { rows } = await db.query(sql);
    assert(rows.length > 0);
  });

  it("db.select(table)", async () => {
    const rows = await db.select("Items");
    assert(_.isArray(rows));
  });

  it("db.trans -> rollback", async () => {
    const srcRows = await db.select("Items", {
      limit: 1,
    });
    try {
      await db.trans(async () => {
        let lines = await db.delete("Items", { FId: srcRows[0].FId });
        assert(lines > 0);
        const row = {
          FName: "China",
          FAge: 70,
          FSex: false,
        };
        lines = await db.insert("Items", [row]);
        assert(lines > 0);

        const t = table<IItem>("Items");
        const item = (
          await db.query<any>(
            select(t.star)
              .from(t)
              .where(t.FId.eq(identityValue("Items", "FId")))
          )
        ).rows[0];
        assert.equal(item.FName, row.FName);
        throw new Error("事务错误回滚测试");
      });
    } catch (ex: any) {
      assert(db.inTransaction === false);
      assert(ex.message === "事务错误回滚测试");
    }

    const rows2 = await db.select("Items", {
      limit: 1,
    });
    assert.deepStrictEqual(rows2[0], srcRows[0]);
  });

  it("db.trans -> commit", async () => {
    await db.trans(async () => {
      await db.query("SET identity_insert [Items] ON");
      const lines = await db.insert("Items", [
        {
          // FId: 10000,
          FName: "Add Test",
          FSex: false,
          FAge: 18,
        },
      ]);
      assert(lines > 0);
      await db.query("SET identity_insert [Items] OFF");
    });

    const rows = await db.select("Items");
    assert(rows.length > 0);
  });

  it("db.query(sql: Execute)", async function () {
    const p2 = output("o", DbType.string(0));
    const sql = execute("doProc", [1, p2]);
    const res = await db.query(sql);

    assert(res.returnValue === 1);
    assert(p2.value === "hello world");
  });

  it("db.execute(sp, [...args])", async function () {
    const p2 = output("o", DbType.string(0));
    const res = await db.execute("doProc", [1, p2]);
    assert(res.returnValue === 1);
    assert(p2.value === "hello world");
  });

  it("convert", async () => {
    const number = 1000;
    const date = new Date();
    const str = "1000";
    const bin = Buffer.from("abc");

    const sql = select({
      strToDate: value(date.toISOString()).to(DbType.datetimeoffset),
      strToint32: value(str).to(DbType.int32),
      int32ToStr: value(number).to(DbType.string(100)),
      strToNumbice: value(str).to(DbType.decimal(18, 2)),
      boolean: value(true).to(DbType.boolean),
      binary: value(bin),
    });
    const {
      rows: [row],
    } = await db.query(sql);
    assert.strictEqual(row.strToDate.toISOString(), date.toISOString());
    assert.strictEqual(row.strToint32, number);
    assert(row.strToNumbice.eq(new Decimal(number)));
    assert.strictEqual(row.int32ToStr, str);
    assert.strictEqual(row.binary.toString(), bin.toString());
  });

  it("db.delete", async function () {
    const lines = await db.delete("Items");
    assert(lines >= 1);
  });
});
