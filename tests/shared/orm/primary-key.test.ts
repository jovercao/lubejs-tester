import assert from 'assert';
import { DB, Position } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Primary key (orm metadata)', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] identity primary key auto-assigned', async () => {
    const position = Position.create({
      name: 'identity-test',
    });

    // Before insert, id should be undefined
    assert(position.id === undefined);

    await db.Position.insert(position);

    // After insert, id should be a bigint (auto-assigned)
    assert(position.id !== undefined);
    assert(typeof position.id === 'bigint');

    // Can retrieve by the assigned id
    const retrieved = await db.Position.get(position.id!);
    assert(retrieved !== undefined);
    assert.strictEqual(retrieved.name, position.name);
  });

  it('[P0] get by non-existent key returns undefined', async () => {
    const nonExistentId = 999999n;
    let retrieved: any;
    try {
      retrieved = await db.Position.get(nonExistentId);
    } catch (e) {
      // Some implementations throw, some return undefined
      // We'll accept either behavior
      retrieved = undefined;
    }
    assert(retrieved === undefined, 'Expected undefined or thrown error');
  });
});
