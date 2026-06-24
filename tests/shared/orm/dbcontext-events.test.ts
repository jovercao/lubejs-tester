import assert from 'assert';
import { User, DB } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('DbContext Events (orm)', function () {
  this.timeout(0);
  let db: DB;

  beforeEach(function () {
    if (process.env.LUBEJS_TEST_KIND !== 'decorator') {
      this.skip();
    }
  });

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) {
      await db.connection.close();
    }
  });

  it('[P0] after event: inserted', async () => {

    let eventFired = false;
    let capturedEntity: User | undefined;

    const onInserted = (event: string, Entity: any, items: User[]) => {
      eventFired = true;
      if (items.length > 0) {
        capturedEntity = items[0];
      }
    };

    db.on('inserted', onInserted);

    try {
      const user = User.create({
        name: 'event-test-user',
        password: '123456',
      });
      await db.User.insert(user);

      assert(eventFired, 'inserted event should be fired');
      assert(capturedEntity !== undefined, 'entity should be captured');
      assert.strictEqual(capturedEntity.id, user.id);
      assert.strictEqual(capturedEntity.name, user.name);
    } finally {
      db.off('inserted', onInserted);
    }
  });

  it('[P0] before event: insert can modify entity', async () => {

    const onInsert = (event: string, Entity: any, items: User[]) => {
      items.forEach(item => {
        item.description = 'modified by before-insert event';
      });
    };

    db.on('insert', onInsert);

    try {
      const user = User.create({
        name: 'before-event-user',
        password: '123456',
        description: 'original description',
      });
      await db.User.insert(user);

      const found = await db.User.get(user.id!);
      assert.strictEqual(found?.description, 'modified by before-insert event');
    } finally {
      db.off('insert', onInsert);
    }
  });

  it('[P0] after event: updated fires on update', async () => {

    let updatedEventFired = false;

    const onUpdated = () => {
      updatedEventFired = true;
    };

    db.on('updated', onUpdated);

    try {
      const user = User.create({
        name: 'updated-event-user',
        password: '123456',
      });
      await db.User.insert(user);

      user.name = 'updated-name';
      await db.User.update(user);

      assert(updatedEventFired, 'updated event should be fired');
    } finally {
      db.off('updated', onUpdated);
    }
  });
});
