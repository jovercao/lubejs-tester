import {
  Connection,
  SQL,
  DbType,
  Parameter,
  FunctionParameter,
  AlterTable,
} from 'lubejs/core';
import assert from 'assert';
import { connectToEmptyDb } from 'tests/util';

describe('tests/core/schema.test.ts', function () {
  this.timeout(0);
  let db: Connection;
  before(async function () {
    db = await connectToEmptyDb({
      config: 'mssql-core-test',
    });
  });

  after(async function () {
    await db.close();
  });

  it('Table & Relation', async () => {
    await db.query(
      SQL.createTable('Item').as(({ column, uniqueKey }) => [
        column('id', DbType.int32).identity(1, 1).primaryKey(),
        column('key', DbType.string(32)).notNull(),
        column('value', DbType.string(DbType.MAX)),
        column('description', DbType.string(100)).null(),
        column('rowflag', DbType.rowflag),
        column('createAt', DbType.datetimeoffset).default(SQL.now()),
        uniqueKey('uk_test').on(['key']),
      ])
    );

    await db.query(
      SQL.createTable('ItemInfo').as(({ column, foreignKey }) => [
        column('id', DbType.int32).primaryKey().identity(1, 1),
        column('itemId', DbType.int32).notNull(),
        column('detailInfo', DbType.string(100)),
        foreignKey('fk_test').reference('Item', ['id']).on(['id']),
      ])
    );

    await db.query(
      SQL.createIndex('ix_test').on('ItemInfo', ['detailInfo']).unique()
    );

    await db.insert('Item', {
      key: 'key1',
      value: 'what is this.',
      description: 'this is hello world!',
    });

    await db.insert('Item', {
      key: 'key2',
      value: 'what is this.',
      description: 'this is hello world!',
    });

    await assert.rejects(async () => {
      await db.insert('Item', {
        key: 'key1',
        value: 'what is this.',
        description: 'this is hello world!',
      });
    }, 'unique key dos not work.');
    let item = await db.find('Item', { key: 'key1' });
    assert(item?.key === 'key1');
    await db.update('Item', { value: 'this is changed' }, { id: item.id });
    item = await db.find('Item', { key: 'key1' });
    assert(item.value === 'this is changed', 'update fail.');

    await db.insert('ItemInfo', {
      itemId: item.id,
      detailInfo: 'this is a detail info',
    });
    await assert.rejects(async () => {
      await db.insert('ItemInfo', {
        itemId: item.id,
        detailInfo: 'this is a detail info',
      });
    }, 'unique index dos not work.');

    await assert.rejects(async () => {
      await db.insert('ItemInfo', {
        itemId: 123454,
        detailInfo: 'this is a detail info',
      });
    }, 'foreign key is not work.');

    await assert.doesNotReject(async () => {
      await db.query(SQL.alterTable('ItemInfo').dropForeignKey('fk_test'));
      await db.insert('ItemInfo', {
        itemId: 342132,
        detailInfo: 'this is a detail infofds abcdefg',
      });
    }, 'drop foreign key dos not work.');

    await assert.doesNotReject(async () => {
      await db.query(SQL.alterTable('Item').dropUniqueKey('uk_test'));
      await db.insert('Item', {
        key: 'key1',
        value: 'hei hei.',
      });
    }, 'drop unique key dos not work.');

    await assert.doesNotReject(async () => {
      await db.query(SQL.alterTable('Item').dropColumn('rowflag'));
      item = await db.find('Item', { id: item.id });
      assert(!item.rowflag);
    }, 'drop column key dos not work.');

    await assert.doesNotReject(async () => {
      await db.query(SQL.dropIndex('ItemInfo', 'ix_test'));
      await db.insert('ItemInfo', {
        itemId: item.id,
        detailInfo: 'this is a detail info',
      });
    }, 'drop index dos not work.');

    await db.delete('ItemInfo', { id: item.id });
    await db.delete('Item', { id: item.id });

    await db.query(SQL.dropTable('ItemInfo'));
    await db.query(SQL.dropTable('Item'));
  });

  it('Function', async () => {
    const schemaName = await db.getSchemaName();
    const $x = new FunctionParameter('x', DbType.int32);
    await db.query(
      SQL.createFunction(`${schemaName}.dosomething`)
        .params($x)
        .returns(DbType.int32)
        .as(SQL.return($x))
    );
    const data1 = await db.queryScalar(
      SQL.select(SQL.func(`${schemaName}.dosomething`).invokeAsScalar(1))
    );
    assert(data1 === 1);
    await db.query(
      SQL.alterFunction(`${schemaName}.dosomething`)
        .params($x)
        .returns(DbType.int32)
        .as([SQL.return($x.add(1))])
    );
    const data2 = await db.queryScalar(
      SQL.select(SQL.func(`${schemaName}.dosomething`).invokeAsScalar(1))
    );
    assert(data2 === 2);
    await db.query(SQL.dropFunction(`${schemaName}.dosomething`));
  });

  it('Procedure', async () => {
    await db.query(
      SQL.createProcedure('doProc')
        .params(param => [
          param('i', DbType.int32),
          param('o', DbType.string(100), 'INOUT', 'no value'),
        ])
        .as(([$i, $o]) => [$o.set('hello world'), SQL.return($i)])
    );
    const params1 = [1, SQL.output('o', DbType.string(100), 'abcdefg')];
    const data1 = await db.execute('doProc', params1);
    assert((params1[1] as Parameter).value === 'hello world');
    assert(data1.returnValue === 1);

    await db.query(
      SQL.alterProcedure('doProc')
        .params(param => [
          param('i', DbType.int32),
          param('o', DbType.string(100), 'INOUT'),
        ])
        .as(([$i, $o]) => [$o.set('hello world 2'), SQL.return($i.add(1))])
    );
    const params2 = [1, SQL.output('o', DbType.string(100), 'abcdefg')];
    const data2 = await db.execute('doProc', params2);
    assert((params2[1] as Parameter).value === 'hello world 2');
    assert(data2.returnValue === 2);

    await db.query(SQL.dropProcedure('doProc'));
  });

  it('View', async () => {
    await db.query(
      SQL.createTable('TestTable').as(({ column }) => [
        column('id', DbType.int32).identity(1, 1).primaryKey(),
        column('name', DbType.string(100)).notNull(),
        column('description', DbType.string(100)).null(),
      ])
    );
    await db.insert('TestTable', [
      {
        name: 'name1',
      },
      {
        name: 'name2',
      },
      {
        name: 'name3',
      },
      {
        name: 'name4',
      },
      {
        name: 'name5',
      },
    ]);

    const t = SQL.table('TestTable').as('t');
    await db.query(
      SQL.createView('TestView').as(
        SQL.select({
          id: t.id,
          name: t.name,
          description: t.description,
        }).from(t)
      )
    );

    const rows1 = await db.select('TestView');
    assert(rows1.length === 5);

    await db.query(
      SQL.alterView('TestView').as(
        SQL.select({
          id: t.id,
          name: t.name.concat('-altered'),
          description: t.description,
        }).from(t)
      )
    );

    const rows2 = await db.select('TestView');
    assert(rows2[0].name === 'name1-altered');
  });

  it('Sequence', async () => {
    await db.query(
      SQL.createSequence('TestSequence')
        .as(DbType.int32)
        .startWith(1)
        .incrementBy(1)
    );

    const value = await db.queryScalar(
      SQL.sequence('TestSequence').nextValue()
    );
    assert(value === 1);

    const value2 = await db.queryScalar(
      SQL.sequence('TestSequence').nextValue()
    );
    assert(value2 === 2);

    await db.query(SQL.dropSequence('TestSequence'));
  });
});
