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
exports.Organization = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const employee_1 = require("./employee");
let Organization = class Organization extends lubejs_1.Entity {
};
exports.Organization = Organization;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.key)(),
    (0, lubejs_1.comment)("OrganizationID"),
    (0, lubejs_1.identity)(),
    __metadata("design:type", BigInt)
], Organization.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.comment)("OrganizationName"),
    (0, lubejs_1.column)(),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)("Description"),
    (0, lubejs_1.nullable)(),
    __metadata("design:type", String)
], Organization.prototype, "description", void 0);
__decorate([
    (0, lubejs_1.comment)("ParentOrganizationID"),
    (0, lubejs_1.column)(),
    __metadata("design:type", BigInt)
], Organization.prototype, "parentId", void 0);
__decorate([
    (0, lubejs_1.foreignKey)("parentId"),
    (0, lubejs_1.manyToOne)(() => Organization, (p) => p.children),
    __metadata("design:type", Organization)
], Organization.prototype, "parent", void 0);
__decorate([
    (0, lubejs_1.detail)(),
    (0, lubejs_1.oneToMany)(() => Organization, (p) => p.parent),
    __metadata("design:type", Array)
], Organization.prototype, "children", void 0);
__decorate([
    (0, lubejs_1.oneToMany)(() => employee_1.Employee, (p) => p.organization),
    __metadata("design:type", Array)
], Organization.prototype, "employees", void 0);
exports.Organization = Organization = __decorate([
    (0, lubejs_1.table)(),
    (0, lubejs_1.comment)("Organization"),
    (0, lubejs_1.context)(() => index_1.DB),
    (0, lubejs_1.data)([
        { id: 0, name: "Company", description: "none" },
        { id: 1, name: "IT", parentId: 0 },
        { id: 2, name: "Administration", parentId: 0 },
    ])
], Organization);
//# sourceMappingURL=orgnaization.js.map