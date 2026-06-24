import assert from 'assert';
import { DB, Employee, Position, Organization } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('ORM: Many-to-Many Relation', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] Insert Employee with nested Positions (many-to-many)', async function () {
    // Get default organization
    const organization = await db.Organization.get(0n);
    assert(organization !== undefined, 'Default organization should exist');

    // Create employee with nested positions - matches the pattern from insert.test.ts
    const employee = Employee.create({
      name: 'Many-to-Many Test Employee',
      description: 'Testing many-to-many relation',
      organization,
      user: {
        name: 'ManyToManyUser',
        password: 'password123',
      },
      positions: [
        {
          name: 'Position M1',
        },
        {
          name: 'Position M2',
        },
      ],
    });

    await db.Employee.insert(employee);

    // Assert employee and user ids set
    assert(employee.id !== undefined, 'Employee id should be set');
    assert(employee.user?.id !== undefined, 'User id should be set');

    // Assert positions ids set
    assert(employee.positions?.[0]?.id !== undefined, 'First position id should be set');
    assert(employee.positions?.[1]?.id !== undefined, 'Second position id should be set');
  });
});
