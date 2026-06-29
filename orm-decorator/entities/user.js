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
exports.User = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const employee_1 = require("./employee");
/**
 * User实体类
 */
let User = class User extends lubejs_1.Entity {
};
exports.User = User;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.key)(),
    (0, lubejs_1.identity)(),
    (0, lubejs_1.comment)("ID"),
    __metadata("design:type", BigInt)
], User.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.comment)("UserName"),
    (0, lubejs_1.column)(),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, lubejs_1.comment)("Password"),
    (0, lubejs_1.nullable)(),
    (0, lubejs_1.column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, lubejs_1.comment)("Description"),
    (0, lubejs_1.nullable)(),
    (0, lubejs_1.column)(),
    __metadata("design:type", String)
], User.prototype, "description", void 0);
__decorate([
    (0, lubejs_1.detail)(),
    (0, lubejs_1.principal)(),
    (0, lubejs_1.oneToOne)(() => employee_1.Employee, (p) => p.user),
    __metadata("design:type", employee_1.Employee)
], User.prototype, "employee", void 0);
exports.User = User = __decorate([
    (0, lubejs_1.comment)("User"),
    (0, lubejs_1.table)(),
    (0, lubejs_1.context)(() => index_1.DB),
    (0, lubejs_1.data)([{ id: 0, name: "admin" }])
], User);
//# sourceMappingURL=user.js.map