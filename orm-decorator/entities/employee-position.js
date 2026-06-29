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
exports.EmployeePosition = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const position_1 = require("./position");
const employee_1 = require("./employee");
let EmployeePosition = class EmployeePosition extends lubejs_1.Entity {
};
exports.EmployeePosition = EmployeePosition;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('ID'),
    (0, lubejs_1.key)(),
    (0, lubejs_1.identity)(),
    __metadata("design:type", BigInt)
], EmployeePosition.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.comment)('PositionID'),
    (0, lubejs_1.column)(),
    __metadata("design:type", BigInt)
], EmployeePosition.prototype, "positionId", void 0);
__decorate([
    (0, lubejs_1.foreignKey)('positionId'),
    (0, lubejs_1.manyToOne)(() => position_1.Position),
    __metadata("design:type", position_1.Position)
], EmployeePosition.prototype, "position", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('EmployeeID'),
    __metadata("design:type", BigInt)
], EmployeePosition.prototype, "employeeId", void 0);
__decorate([
    (0, lubejs_1.foreignKey)('employeeId'),
    (0, lubejs_1.manyToOne)(() => employee_1.Employee),
    __metadata("design:type", employee_1.Employee)
], EmployeePosition.prototype, "employee", void 0);
exports.EmployeePosition = EmployeePosition = __decorate([
    (0, lubejs_1.table)(),
    (0, lubejs_1.context)(() => index_1.DB)
    // @among(() => Position, () => Employee, 'position', 'employee')
    ,
    (0, lubejs_1.among)(() => position_1.Position, () => employee_1.Employee, p => p.position, p => p.employee)
], EmployeePosition);
//# sourceMappingURL=employee-position.js.map