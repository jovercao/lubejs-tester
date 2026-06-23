import assert from 'assert';
import { User, DB } from '@orm';
import { connectToEmptyDbContext } from 'tests/util';

describe('Repository: context events ———— ./tests/repository/context-events.test.ts', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext({ disableLog: true });
  });

  after(async () => {
    if (db?.connection?.opened) {
      await db.connection.close();
    }
  });

  it('DbContext.on receives repository insert and inserted events', async () => {
    const events: string[] = [];
    const allEvents: string[] = [];

    db.on('insert', (event, Entity, items) => {
      events.push(`insert:${Entity.name}:${items.length}`);
    });
    db.on('inserted', (event, Entity, items) => {
      events.push(`inserted:${Entity.name}:${items.length}`);
    });
    db.on('all', (event, Entity, items) => {
      allEvents.push(`${event}:${Entity.name}:${items.length}`);
    });

    await db.User.insert(
      User.create({
        name: 'context event user',
        password: '123456',
      })
    );

    assert.deepStrictEqual(events, ['insert:User:1', 'inserted:User:1']);
    assert(allEvents.includes('insert:User:1'));
    assert(allEvents.includes('inserted:User:1'));
  });
});
