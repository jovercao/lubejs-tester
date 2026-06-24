import assert from 'assert';
import { DB, Employee, User, Organization } from '@orm';
import { connectToEmptyDbContext } from '../../util';

describe('ORM: One-to-One Relation', function () {
  this.timeout(0);
  let db: DB;

  before(async () => {
    db = await connectToEmptyDbContext();
  });

  after(async () => {
    if (db?.connection?.opened) await db.connection.close();
  });

  it('[P0] Insert Employee with nested User (one-to-one)', async () => {
    // Get default organization
    const organization = await db.Organization.get(0n);
    assert(organization !== undefined, 'Default organization should exist');

    // Create employee with nested user
    const employee = Employee.create({
      name: 'One-to-One Test Employee',
      description: 'Testing one-to-one relation',
      organization,
      user: {
        name: 'OneToOneUser',
        password: 'password123',
        description: 'User for one-to-one test',
      },
    });

    await db.Employee.insert(employee);

    // Assert both ids set
    assert(employee.id !== undefined, 'Employee id should be set');
    assert(employee.user?.id !== undefined, 'User id should be set');

    // Assert the FK link (employee.userId)
    assert(employee.userId !== undefined, 'Employee userId should be set');
    assert.strictEqual(employee.userId, employee.user.id, 'Employee userId should match user id');
  });

  it('[P0] Query Employee with eager loaded user', async () => {
    // Get default organization
    const organization = await db.Organization.get(0n);

    // Create employee with user
    const employee = Employee.create({
      name: 'Eager One-to-One Employee',
      description: 'Testing eager loading one-to-one',
      organization,
      user: {
        name: 'EagerOneToOneUser',
        password: 'password123',
      },
    });

    await db.Employee.insert(employee);
    const employeeId = employee.id!;

    // Query back with eager loading
    const fetchedEmployee = await db.Employee.query()
      .filter(p => p.id.eq(employeeId))
      .include({ user: true })
      .fetchFirst();

    assert(fetchedEmployee !== undefined, 'Employee should be found');
    assert(fetchedEmployee.user !== undefined, 'User should be eager loaded');
    assert.strictEqual(typeof fetchedEmployee.user, 'object', 'User should be an object');
  });

  it('[P0] Insert User with nested Employee (primary one-to-one)', async () => {
    // Get default organization
    const organization = await db.Organization.get(0n);

    // Create user with nested employee (reverse direction)
    const user = User.create({
      name: 'PrimaryOneToOneUser',
      password: 'password123',
      description: 'User as principal',
      employee: {
        name: 'Primary One-to-One Employee',
        organization,
      },
    });

    await db.User.insert(user);

    // Assert both ids set
    assert(user.id !== undefined, 'User id should be set');
    assert(user.employee?.id !== undefined, 'Employee id should be set');
  });
});
