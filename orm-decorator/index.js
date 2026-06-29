"use strict";
/*************************试验代码****************************/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
const orgnaization_1 = require("./entities/orgnaization");
const order_1 = require("./entities/order");
const position_1 = require("./entities/position");
const employee_1 = require("./entities/employee");
const user_1 = require("./entities/user");
require("./entities/employee-position");
const lubejs_1 = require("lubejs");
require("lubejs-mssql");
let DB = class DB extends lubejs_1.DbContext {
};
exports.DB = DB;
__decorate([
    (0, lubejs_1.repository)(() => orgnaization_1.Organization),
    __metadata("design:type", lubejs_1.Repository)
], DB.prototype, "Organization", void 0);
__decorate([
    (0, lubejs_1.repository)(() => order_1.Order),
    __metadata("design:type", lubejs_1.Repository)
], DB.prototype, "Order", void 0);
__decorate([
    (0, lubejs_1.repository)(() => position_1.Position),
    __metadata("design:type", lubejs_1.Repository)
], DB.prototype, "Position", void 0);
__decorate([
    (0, lubejs_1.repository)(() => employee_1.Employee),
    __metadata("design:type", lubejs_1.Repository)
], DB.prototype, "Employee", void 0);
__decorate([
    (0, lubejs_1.repository)(() => user_1.User),
    __metadata("design:type", lubejs_1.Repository)
], DB.prototype, "User", void 0);
exports.DB = DB = __decorate([
    (0, lubejs_1.comment)("Test Database"),
    (0, lubejs_1.connection)("mssql://sa:!crgd-2019@jover.wicp.net:2433/Test"),
    (0, lubejs_1.database)("Test")
], DB);
lubejs_1.modelBuilder.ready();
__exportStar(require("./entities/employee"), exports);
__exportStar(require("./entities/user"), exports);
__exportStar(require("./entities/order"), exports);
__exportStar(require("./entities/order-detail"), exports);
__exportStar(require("./entities/orgnaization"), exports);
__exportStar(require("./entities/position"), exports);
__exportStar(require("./entities/employee-position"), exports);
//# sourceMappingURL=index.js.map