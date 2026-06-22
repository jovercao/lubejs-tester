import { Command, DbProvider, SQL, SqlCommand } from 'lubejs';
import { driver } from 'lubejs-mssql';
import assert from 'assert';

const {
  table,
  select,
  case: $case,
  and,
  or,
  literal: value,
  field,
  addDays,
  now,
  nvl,
  count,
} = SQL;

describe('AST Test  ————  tests/core/sql-ast.test.ts', function () {
  const db: DbProvider = driver();

  it('SQL.prototype.clone', async () => {
    const abc = table('abc');
    const abcCopied = abc.clone();

    assert.deepStrictEqual(abcCopied.abc.$name, 'abc');

    const offset: number = 0,
      limit: number = 50,
      providerId: number | null = null,
      producerId: number | null = null,
      productId: number | null = null,
      warehouseId: number | null = null,
      location: string | null = null,
      qualityStatus: number | null = null,
      nearExpire: boolean | null = null,
      unsalable: boolean | null = null,
      keyword: string | null = null;
    let nearExpireDay: number = 180,
      unsalableDay: number = 180;

    unsalableDay = unsalableDay || 180;
    nearExpireDay = nearExpireDay || 180;

    const unsalableStock = table('stock').as('unsalableStock');
    const stock = select({
      id: unsalableStock.id,
      date: unsalableStock.date,
      code: unsalableStock.code,
      productId: unsalableStock.productId,
      quantity: unsalableStock.quantity,
      unit: unsalableStock.unit,
      providerId: unsalableStock.providerId,
      comefromId: unsalableStock.comefromId,
      warehouseId: unsalableStock.warehouseId,
      description: unsalableStock.description,
      amount: unsalableStock.quantity.mul(nvl(unsalableStock.costPrice, 0)),
      qualityStatus: unsalableStock.status,
      location: unsalableStock.location,
      isNearExpiry: $case()
        .when(
          addDays(now(), nearExpireDay).gte(unsalableStock.expiryDate),
          true
        )
        .else(false),
      isUnsalable: $case()
        .when(addDays(unsalableStock.date, unsalableDay).gte(now()), true)
        .else(false),
      belongId: unsalableStock.belongId,
    })
      .from(unsalableStock)
      .as('stock');

    const product = table('product').as('product');
    const provider = table('company').as('provider');
    const comefrom = table('company').as('comefrom');
    const producer = table('company').as('producer');
    const warehouse = table('warehouse').as('warehouse');

    const detailSql = select({
      id: stock.id,
      date: stock.date,
      code: stock.code,
      productId: stock.productId,
      drugName: product.drugName,
      goodsName: product.goodsName,
      specs: product.specs,
      model: product.model,
      quantity: stock.quantity,
      unit: stock.unit,
      providerId: stock.providerId,
      providerName: provider.name,
      providerCode: provider.code,
      comefromId: stock.comefromId,
      comefromCode: comefrom.code,
      comefromName: comefrom.name,
      producerId: product.producerId,
      producerCode: producer.code,
      producerName: producer.name,
      warehouseId: stock.warehouseId,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.name,
      description: stock.description,
      location: stock.location,
      amount: stock.amount,
      qualityStatus: stock.qualityStatus,
      isNearExpiry: stock.isNearExpiry,
      isUnsalable: stock.isUnsalable,
      belongId: stock.belongId,
    })
      .from(stock)
      .join(product, product.id.eq(stock.productId))
      .leftJoin(producer, producer.id.eq(product.producerId))
      .leftJoin(provider, provider.id.eq(stock.providerId))
      .leftJoin(comefrom, comefrom.id.eq(stock.comefromId))
      .leftJoin(warehouse, warehouse.id.eq(stock.warehouseId))
      .where(
        and(
          stock.quantity.gt(0),
          or(value(productId).isNull(), stock.productId.eq(productId)),
          or(value(providerId).isNull(), stock.providerId.eq(providerId)),
          or(value(producerId).isNull(), product.producerId.eq(producerId)),
          or(value(warehouseId).isNull(), stock.warehouseId.eq(warehouseId)),
          or(nvl(location, '').eq(''), stock.location.like(location!)),
          or(
            value(qualityStatus).isNull(),
            stock.qualityStatus.eq(qualityStatus)
          ),
          or(value(unsalable).isNull(), stock.isUnsalable.eq(unsalable)),
          or(value(nearExpire).isNull(), stock.isNearExpiry.eq(nearExpire))
        )
      );
    const countView = detailSql.as('countView');
    const countSql = select(count(countView.id)).from(countView);
    const copiedCountSql = countSql.clone();

    assert(countView !== copiedCountSql.$froms![0]);
    assert.deepStrictEqual((copiedCountSql.$froms![0] as any).abc.$name, 'abc');

    const sql = db.sqlifier.sqlify(countSql);
    const copiedSql = db.sqlifier.sqlify(copiedCountSql);
    assert(isEqualCommand(sql, copiedSql), '克隆功能不正确，SQL不匹配');
  });

  it('and/or', function () {
    const sql = select(1).where(
      and(
        value(1).eq(1),
        value(1).eq(1).or(value(1).eq(1)),
        or(
          value(1).eq(1),
          value(1).eq(1).or(value(1).eq(1)),
          field('name').in([1, 2, 3, 4]),
          field('name').in(...[1, 2, 3, 4]),
          field('name').in(1, 2, 3, 4)
        )
      )
    );

    const cmd = db.sqlifier.sqlify(sql);
    console.log(cmd);
    assert(
      (cmd as SqlCommand).sql.endsWith(
        'WHERE (1 = 1 AND (1 = 1 OR 1 = 1) AND (1 = 1 OR (1 = 1 OR 1 = 1) OR [name] IN (1,2,3,4) OR [name] IN (1,2,3,4) OR [name] IN (1,2,3,4)))'
      )
    );
  });
});

function isEqualCommand(cmd1: Command, cmd2: Command) {
  const type1 = typeof cmd1;
  const type2 = typeof cmd2;
  if (type1 !== type2) return false;
  if (type1 === 'function') return cmd1 === cmd2;
  if ((cmd1 as SqlCommand).sql !== (cmd2 as SqlCommand).sql) return false;
  const params1 = (cmd1 as SqlCommand).params;
  const params2 = (cmd2 as SqlCommand).params;
  if ((params1?.length || 0) !== (params2?.length || 0)) {
    return false;
  }
  // 比较参数名时排序副本，避免就地修改原 Command 的 params。
  const names1 = (params1 || []).map(p => p.name).sort((a, b) => a.localeCompare(b));
  const names2 = (params2 || []).map(p => p.name).sort((a, b) => a.localeCompare(b));
  for (let i = 0; i < names1.length; i++) {
    if (names1[i] !== names2[i]) {
      return false;
    }
  }
  return true;
}
