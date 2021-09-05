import {
  connect,
  SQL,
  Decimal,
  Uuid,
  Connection,
  DbType,
  outputCommand,
} from "lubejs";
import "lubejs-mssql";

interface Table1 {
  id: number;
  name: string;
  stringField?: string;
  floatField?: number;
  dateField?: Date;
  decimalField?: Decimal;
  uuidField?: Uuid;
  updatedAt: Date;
  binaryField?: ArrayBuffer;
  createdAt: Date;
  operator?: string;
}

interface Pay {
  id?: number;
  year: number;
  month: number;
  amount: Decimal;
  personId: number;
}

interface Person {
  id?: number;
  name: string;
  age: number;
}

/**
 * 初始化数据库
 */
async function initDb(db: Connection) {
  await db.query(
    SQL.if(SQL.std.existsTable('table1')).then(SQL.dropTable("table1"))
  );

  await db.query(
    SQL.createTable("table1").as(({ column }) => [
      column("id", DbType.int32).identity().primaryKey(),
      column("name", DbType.string(100)).notNull(),
      column("stringField", DbType.string(100)).null(),
      column("floatField", DbType.float).null(),
      column("dateField", DbType.datetimeoffset).null(),
      column("decimalField", DbType.decimal(18, 6)),
      column("uuidField", DbType.uuid),
      column("updatedAt", DbType.datetimeoffset).default(SQL.std.now()),
      column("binaryField", DbType.binary(DbType.MAX)),
      column("createdAt", DbType.datetimeoffset).default(SQL.std.now()),
      column("operator", DbType.string(100)).null(),
    ])
  );

  await db.query(
    SQL.if(SQL.std.existsTable('pay')).then(SQL.dropTable("pay"))
  );

  await db.query(
    SQL.createTable("pay").as(({ column }) => [
      column("id", DbType.int32).identity().primaryKey(),
      column("year", DbType.int32),
      column("month", DbType.int32),
      column("amount", DbType.decimal(18, 2)),
      column("personId", DbType.int32),
    ])
  );

  await db.query(
    SQL.if(SQL.std.existsTable('person')).then(SQL.dropTable("person"))
  );

  await db.query(
    SQL.createTable("person").as(({ column }) => [
      column("id", DbType.int32).identity().primaryKey(),
      column("name", DbType.int32).notNull(),
      column("age", DbType.int32),
    ])
  );

}

/**
 * Table1表声明
 */
// 这是一个范例
async function example(db: Connection) {
  //---------------插入数据------------------
  /*
   * INSERT INTO table1 (stringField, floatField, dateField)
   * VALUES ('value1-1', 2, Convert(DATETIMEOFFSET, '2019-11-18 00:00:00'))
   * ('value1-2', 1, Convert(DATETIMEOFFSET, '2019-11-18 00:00:00'))
   * ('value1-3', 45, Convert(DATETIMEOFFSET, '2019-11-18 00:00:00'))
   */
  const insertSql = SQL.insert<Table1>("table1").values([
    {
      name: "item1",
      stringField: "value1-1",
      floatField: 3.14,
      dateField: new Date(),
      decimalField: new Decimal("3.1415"),
      uuidField: Uuid.new(),
      binaryField: Buffer.from('abcdefeg')
    },
    {
      name: "item2",
      stringField: "value1-2",
      floatField: 1.132,
      dateField: new Date(),
      decimalField: new Decimal("3.1415"),
      uuidField: Uuid.new(),
      binaryField: Buffer.from('abcdefeg')
    },
    {
      name: "item3",
      stringField: "value1-3",
      floatField: 45.2656,
      dateField: new Date(),
      decimalField: new Decimal("3.1415"),
      uuidField: Uuid.new(),
      binaryField: Buffer.from('abcdefeg')
    },
  ]);

  await db.query(insertSql);

  // 你还以使用以下方式插入，等效于上面的写法
  await db.insert<Table1>("table1", [
    {
      name: "item1",
      stringField: "value1-1",
      floatField: 3.14,
      dateField: new Date(),
      decimalField: new Decimal("3.1415"),
      uuidField: Uuid.new(),
      binaryField: Buffer.from('abcdefeg')
    },
    {
      name: "item2",
      stringField: "value1-2",
      floatField: 1.132,
      dateField: new Date(),
      decimalField: new Decimal("3.1415"),
      uuidField: Uuid.new(),
      binaryField: Buffer.from('abcdefeg')
    },
    {
      name: "item3",
      stringField: "value1-3",
      floatField: 45.2656,
      dateField: new Date(),
      decimalField: new Decimal("3.1415"),
      uuidField: Uuid.new(),
      binaryField: Buffer.from('abcdefeg')
    },
  ]);

  //---------------更新数据------------------
  // UPDATE t SET updatedAt = Convert(DateTime, '2019-11-18 00:00:00') FROM table1 t WHERE id = 1
  const t = SQL.table<Table1>("table1").as("t");
  const updateSql = SQL.update(t)
    .set({ updatedAt: new Date(), operator: "your name" })
    .where(t.id.eq(1));
  await db.query(updateSql);

  // 你还以使用以下方式更新，等效于上面的写法
  await db.update<Table1>(
    "table1",
    { updatedAt: new Date(), operator: "your name" },
    { id: 1 }
  );

  //---------------删除数据-------------------
  // DELETE t FROM table1 t WHERE t.id = 1
  const deleteSql = SQL.delete(t).from(t).where(t.id.eq(1));
  await db.query(deleteSql);

  // 你还以使用以下方式删除
  // DELETE table1 WHERE id = 1
  await db.delete("table1", { id: 1 });

  //----------------查询数据--------------------
  // SELECT t.* FROM table1 AS t WHERE t.id = 1 AND t.name = 'name1'
  const selectSql = SQL.select(t._)
    .from(t)
    .where(SQL.and(t.id.eq(1), t.name.eq("name1")));
  console.log((await db.query(selectSql)).rows);

  //  You can also select in this way
  // SELECT * FROM table1 WHERE id = 1 AND name = 'name1'
  console.log(
    await await db.select("table1", {
      where: {
        id: 1,
        name: "item1",
      },
    })
  );



  // //---------------以下是一个复合查询------------
  const p = SQL.table<Person>("person").as("p");
  const pay = SQL.table<Pay>("pay");
  const sql = SQL.select(
    pay.year,
    pay.month,
    p.name,
    p.age,
    SQL.std.sum(pay.amount).as("total")
  )
    .from(pay)
    .join(p, pay.personId.eq(p.id))
    .where(p.age.lte(18))
    .groupBy(p.name, p.age, pay.year, pay.month)
    .having(SQL.std.sum(pay.amount).gte(new Decimal(100000)))
    .orderBy(pay.year.asc(), pay.month.asc(), SQL.std.sum(pay.amount).asc(), p.age.asc())
    .offset(20)
    .limit(50);

  console.log((await db.query(sql)).rows);
}


(async () => {
  // 创建一个Lube连接
  const db = await connect("mssql://sa:!crgd-2021@rancher.vm/Test");
  // 打开连接
  await db.open();
  // 输出日志
  db.on('command', outputCommand)
  try {
    await initDb(db);
    await example(db);
  } finally {
    await db.close();
  }
})();
