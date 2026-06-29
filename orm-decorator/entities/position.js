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
exports.Position = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const employee_1 = require("./employee");
let Position = class Position extends lubejs_1.Entity {
};
exports.Position = Position;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)("PositionID"),
    (0, lubejs_1.identity)(),
    (0, lubejs_1.key)(),
    __metadata("design:type", BigInt)
], Position.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.comment)("PositionName"),
    (0, lubejs_1.column)(),
    __metadata("design:type", String)
], Position.prototype, "name", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)("Description"),
    (0, lubejs_1.nullable)(),
    __metadata("design:type", String)
], Position.prototype, "description", void 0);
__decorate([
    (0, lubejs_1.manyToMany)(() => employee_1.Employee, (p) => p.positions),
    __metadata("design:type", Array)
], Position.prototype, "employees", void 0);
exports.Position = Position = __decorate([
    (0, lubejs_1.table)(),
    (0, lubejs_1.comment)("Position"),
    (0, lubejs_1.context)(() => index_1.DB),
    (0, lubejs_1.data)([
        { id: 1, name: "general manager", description: "none" },
        { id: 2, name: "chief inspector", description: "none" },
        { id: 3, name: "clerk", description: "none" },
    ])
], Position);
//# sourceMappingURL=position.js.map