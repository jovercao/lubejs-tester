import { createLube, SqlBuilder as SQL, Decimal, Uuid, InputObject } from 'lubejs';
import 'lubejs-mssql';

interface Table1 {
  id: number;
  name: string;
  stringField?: string,
  floatField?: number,
  dateField?: Date,
  decimalField?: Decimal,
  uuidField?: Uuid,
  updatedAt: Date,
  createdAt: Date,
  operator?: string
}

/**
 * Table1表声明
 */
// 这是一个范例
async function example() {
  // 创建一个Lube连接
  const db = await createLube('mssql://sa:password@rancher.vm/test-db');

  // 打开连接
  await db.open();

  // 初始化数据库，请在MSSQL执行
  await db.query`CREATE TABLE table1(
  id INT identity(1, 1) primary key,
  stringField nvarchar(100),
  floatField2 float,
  dateField DATETIMEOFFSET,
  decimalField DECIMAL(18, 6),
  uuidField UNIQUEIDENTIFIER,
  updatedAt DATETIMEOFFSET NOT NULL default (getdate()),
  createdAt DATETIMEOFFSET NOT NULL default (getdate()),
  operator nvarchar(100)
)`

  //---------------插入数据------------------
  /*
   * INSERT INTO table1 (stringField, floatField, dateField)
   * VALUES ('value1-1', 2, Convert(DATETIMEOFFSET, '2019-11-18 00:00:00'))
   * ('value1-2', 1, Convert(DATETIMEOFFSET, '2019-11-18 00:00:00'))
   * ('value1-3', 45, Convert(DATETIMEOFFSET, '2019-11-18 00:00:00'))
   */
  const insertSql = SQL.insert<Table1>('table1').values([
    { name: 'item1', stringField: 'value1-1', floatField: 3.14, dateField: new Date(), decimalField: new Decimal('3.1415'), uuidField: Uuid.new() },
    { name: 'item2', stringField: 'value1-2', floatField: 1.132, dateField: new Date(), decimalField: new Decimal('3.1415'), uuidField: Uuid.new() },
    { name: 'item3', stringField: 'value1-3', floatField: 45.2656, dateField: new Date(), decimalField: new Decimal('3.1415'), uuidField: Uuid.new() },
  ]);

  await db.query(insertSql);

  // 你还以使用以下方式插入，等效于上面的写法
  await db.insert<Table1>('table1', [
    { name: 'item1', stringField: 'value1-1', floatField: 3.14, dateField: new Date(), decimalField: new Decimal('3.1415'), uuidField: Uuid.new() },
    { name: 'item2', stringField: 'value1-2', floatField: 1.132, dateField: new Date(), decimalField: new Decimal('3.1415'), uuidField: Uuid.new() },
    { name: 'item3', stringField: 'value1-3', floatField: 45.2656, dateField: new Date(), decimalField: new Decimal('3.1415'), uuidField: Uuid.new() },
  ]);

  //---------------更新数据------------------
  // UPDATE t SET updatedAt = Convert(DateTime, '2019-11-18 00:00:00') FROM table1 t WHERE id = 1
  const t = SQL.table<Table1>('table1').as('t');
  const updateSql = SQL.update(t)
    .set({ updatedAt: new Date(), operator: 'your name' })
    .where(t.id.eq(1));
  await db.query(updateSql);

  // 你还以使用以下方式更新，等效于上面的写法
  await db.update<Table1>(
    'table1',
    { updatedAt: new Date(), operator: 'your name' },
    { id: 1 }
  );

  //---------------删除数据-------------------
  // DELETE t FROM table1 t WHERE t.id = 1
  const deleteSql = SQL.delete(t).from(t).where(t.id.eq(1));
  await db.query(deleteSql);

  // 你还以使用以下方式删除
  // DELETE table1 WHERE id = 1
  await db.delete('table1', { id: 1 });

  //----------------查询数据--------------------
  // SELECT t.* FROM table1 AS t WHERE t.id = 1 AND t.name = 'name1'
  const selectSql = SQL.select(t._)
    .from(t)
    .where(SQL.and(t.id.eq(1), t.name.eq('name1')));
  console.log((await db.query(selectSql)).rows);

  //  You can also select in this way
  // SELECT * FROM table1 WHERE id = 1 AND name = 'name1'
  console.log(
    await await db.select('table1', {
      where: {
        id: 1,
        name: 'name1',
      },
    })
  );

  //---------------以下是一个复合查询 (mssql)------------
  /*
   * SELECT
   *     pay.year,
   *     pay.month
   *     p.name,
   *     p.age,
   *     sum(pay.amount) as total,
   * FROM pay
   * JOIN persion as p ON pay.persionId = p.id
   * WHERE p.age >= 18
   * GROUP BY
   *     p.name,
   *     p.age,
   *     pay.year,
   *     pay.month
   * HAVING SUM(pay.amount) >= 100000.00
   * ORDER BY
   *     pay.year ASC,
   *     pay.month ASC,
   *     pay.amount ASC,
   *     p.age ASC
   *  OFFSET 20 ROWS
   *  FETCH NEXT 50 ROWS ONLY
   */
  const p = SQL.table('person').as('p');
  const pay = SQL.table('pay');
  const sql = SQL.select(
    pay.year,
    pay.month,
    p.name,
    p.age,
    SQL.sum(pay.amount).as('total')
  )
    .from(pay)
    .join(p, pay.persionId.eq(p.id))
    .where(p.age.lte(18))
    .groupBy(p.name, p.age, pay.year, pay.month)
    .having(SQL.sum(pay.amount).gte(100000.0))
    .orderBy(pay.year.asc(), pay.month.asc(), pay.amount.asc(), p.age.asc())
    .offset(20)
    .limit(50);

  console.log((await db.query(sql)).rows);

  // 关闭连接
  await db.close();
}

example();
