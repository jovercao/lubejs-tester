"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = exports.Organization = exports.EmployeePosition = exports.Employee = exports.Position = exports.OrderDetail = exports.Order = exports.User = void 0;
const lubejs_1 = require("lubejs");
/**
 * 用户实体类
 */
class User extends lubejs_1.Entity {
}
exports.User = User;
/**
 * 订单
 */
class Order extends lubejs_1.Entity {
}
exports.Order = Order;
/**
 * 订单明细
 */
class OrderDetail extends lubejs_1.Entity {
}
exports.OrderDetail = OrderDetail;
class Position extends lubejs_1.Entity {
}
exports.Position = Position;
class Employee extends lubejs_1.Entity {
}
exports.Employee = Employee;
class EmployeePosition extends lubejs_1.Entity {
}
exports.EmployeePosition = EmployeePosition;
class Organization extends lubejs_1.Entity {
}
exports.Organization = Organization;
class DB extends lubejs_1.DbContext {
    get Organization() {
        return this.getRepository(Organization);
    }
    get Order() {
        return this.getRepository(Order);
    }
    get Position() {
        return this.getRepository(Position);
    }
    get Employee() {
        return this.getRepository(Employee);
    }
    get User() {
        return this.getRepository(User);
    }
}
exports.DB = DB;
lubejs_1.modelBuilder
    .context(DB, (context) => {
    context
        .entity(User)
        .asTable((table) => {
        table.hasComment("Employee");
        table
            .property((p) => p.id, BigInt)
            .isIdentity()
            .hasComment("ID");
        table.property((p) => p.name, String).hasComment("EmployeeName");
        table
            .property((p) => p.password, String)
            .isNullable()
            .hasComment("Password");
        table
            .property((p) => p.description, String)
            .isNullable()
            .hasComment("Description");
        table
            .hasOne((p) => p.employee, Employee)
            .withOne((p) => p.user)
            .isPrimary()
            .hasComment("BindEmployee")
            .isDetail();
        table.hasKey((p) => p.id).hasComment("PrimaryKey");
        table.hasData([{ id: 0, name: "admin" }]);
    })
        .entity(Position)
        .asTable((table) => {
        table.hasComment("Position");
        table
            .property((p) => p.id, BigInt)
            .isIdentity()
            .hasComment("ID");
        table.property((p) => p.name, String).hasComment("PositionName");
        table
            .property((p) => p.description, String)
            .isNullable()
            .hasComment("Description");
        table.hasKey((p) => p.id).hasComment("PrimaryKey");
        table
            .hasMany((p) => p.employees, Employee)
            .withMany((p) => p.positions)
            .hasRelationTable(EmployeePosition);
        table.hasData([
            { id: 1, name: "general manager", description: "none" },
            { id: 2, name: "chief inspector", description: "none" },
            { id: 3, name: "clerk", description: "none" },
        ]);
    })
        .entity(Organization)
        .asTable((builder) => {
        builder.property((p) => p.id, BigInt).isIdentity();
        builder.property((p) => p.name, String);
        builder.property((p) => p.description, String).isNullable();
        builder
            .hasMany((p) => p.employees, Employee)
            .withOne((p) => p.organization);
        builder
            .hasOne((p) => p.parent, Organization)
            .withMany()
            .hasForeignKey((p) => p.parentId);
        builder
            .hasMany((p) => p.children, Organization)
            .withOne((p) => p.parent)
            .isDetail();
        builder.hasData([
            { id: 0, name: "Company", description: "none" },
            { id: 1, name: "IT", parentId: 0 },
            { id: 2, name: "Administration", parentId: 0 },
        ]);
    })
        .entity(Employee)
        .asTable((builder) => {
        builder.property((p) => p.id, BigInt).isIdentity();
        builder
            .property((p) => p.name, String)
            .hasType(lubejs_1.DbType.string(100))
            .isNullable();
        builder
            .property((p) => p.description, String)
            .hasType(lubejs_1.DbType.string(100))
            .isNullable();
        builder
            .hasMany((p) => p.positions, Position)
            .withMany((p) => p.employees)
            .isDetail();
        builder.hasKey((p) => p.id);
        builder
            .hasOne((p) => p.organization, Organization)
            .withMany((p) => p.employees)
            .isRequired();
        builder
            .hasOne((p) => p.user, User)
            .withOne((p) => p.employee)
            .hasForeignKey()
            .isRequired();
        builder.hasData([
            { id: 0, name: "Administrator", userId: 0, organizationId: 0 },
        ]);
    })
        .entity(Order)
        .asTable((builder) => {
        builder.property((p) => p.id, BigInt).isIdentity();
        builder
            .property((p) => p.orderNo, String)
            .hasType(lubejs_1.DbType.string(20))
            .isAutogen((item) => "abc");
        builder
            .property((p) => p.date, Date)
            .hasType(lubejs_1.DbType.datetime)
            .hasDefaultValue(lubejs_1.SQL.now());
        builder.property((p) => p.description, String).isNullable();
        builder
            .hasMany((p) => p.details, OrderDetail)
            .withOne((p) => p.order)
            .isDetail();
        builder.property((p) => p.rowflag, Buffer).isRowflag();
        builder.hasKey((p) => p.id);
        builder
            .hasIndex("IX_Order_OrderNo")
            .withProperties((p) => [p.orderNo])
            .hasComment("OrderNo Index");
    })
        .entity(OrderDetail)
        .asTable((builder) => {
        builder.property((p) => p.id, BigInt).isIdentity();
        builder.property((p) => p.product, String);
        builder.property((p) => p.count, Number);
        builder
            .property((p) => p.price, lubejs_1.Decimal)
            .hasType(lubejs_1.DbType.decimal(18, 6));
        builder
            .property((p) => p.amount, lubejs_1.Decimal)
            .hasType(lubejs_1.DbType.decimal(18, 2));
        builder.property((p) => p.orderId, BigInt);
        builder.property((p) => p.description, String).isNullable();
        builder
            .hasOne((p) => p.order, Order)
            .withMany((p) => p.details)
            .hasForeignKey((p) => p.orderId)
            .isRequired();
        builder.hasKey((p) => p.id);
    });
})
    .ready();
//# sourceMappingURL=orm-configure.js.map