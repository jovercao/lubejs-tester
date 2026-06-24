import assert from 'assert';
import { DB, User, Position } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('Column mapping (orm metadata)', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] not-null and nullable columns', async () => {
    // Insert User with only required fields (name, password)
    // description is nullable and omitted
    const user = User.create({
      name: 'nullable-test',
      password: 'required-pass',
      // description omitted (nullable)
    });

    await db.User.insert(user);
    assert(user.id !== undefined);

    const retrieved = await db.User.get(user.id!);
    assert(retrieved !== undefined);
    assert.strictEqual(retrieved.name, user.name);
    assert.strictEqual(retrieved.password, user.password);
    // description should be null/undefined
    assert(retrieved.description == null);
  });

  it('[P0] nullable column accepts explicit null', async () => {
    const position = Position.create({
      name: 'position-null-test',
      description: null, // explicit null
    });

    await db.Position.insert(position);
    assert(position.id !== undefined);

    const retrieved = await db.Position.get(position.id!);
    assert(retrieved !== undefined);
    assert.strictEqual(retrieved.name, position.name);
    assert(retrieved.description == null);
  });
});
