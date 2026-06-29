"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const orgnaization_1 = require("./orgnaization");
const position_1 = require("./position");
const user_1 = require("./user");
let Employee = class Employee extends lubejs_1.Entity {
};
exports.Employee = Employee;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.key)(),
    (0, lubejs_1.comment)("EmployeeID"),
    (0, lubejs_1.identity)(),
    __metadata("design:type", BigInt)
], Employee.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.comment)("Name"),
    (0, lubejs_1.column)(),
    __metadata("design:type", String)
], Employee.prototype, "name", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)("Description"),
    (0, lubejs_1.nullable)(),
    __metadata("design:type", String)
], Employee.prototype, "description", void 0);
__decorate([
    (0, lubejs_1.manyToOne)(() => orgnaization_1.Organization, (p) => p.employees),
    __metadata("design:type", orgnaization_1.Organization)
], Employee.prototype, "organization", void 0);
__decorate([
    (0, lubejs_1.detail)(),
    (0, lubejs_1.manyToMany)(() => position_1.Position, (p) => p.employees),
    __metadata("design:type", Array)
], Employee.prototype, "positions", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)("UserID"),
    __metadata("design:type", BigInt)
], Employee.prototype, "userId", void 0);
__decorate([
    (0, lubejs_1.foreignKey)("userId"),
    (0, lubejs_1.oneToOne)(() => user_1.User, (p) => p.employee),
    __metadata("design:type", user_1.User)
], Employee.prototype, "user", void 0);
exports.Employee = Employee = __decorate([
    (0, lubejs_1.table)(),
    (0, lubejs_1.comment)("Employee"),
    (0, lubejs_1.context)(() => index_1.DB),
    (0, lubejs_1.data)([{ id: 0, name: "Administrator", userId: 0, organizationId: 0 }])
], Employee);
//# sourceMappingURL=employee.js.map