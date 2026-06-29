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
exports.Order = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const order_detail_1 = require("./order-detail");
const relation_decorators_1 = require("lubejs/orm/decorators/relation-decorators");
/**
 * Order
 */
let Order = class Order extends lubejs_1.Entity {
};
exports.Order = Order;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('ID'),
    (0, lubejs_1.key)(),
    (0, lubejs_1.identity)(),
    __metadata("design:type", BigInt)
], Order.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.comment)('OrderDate'),
    (0, lubejs_1.defaultValue)(() => lubejs_1.SQL.now()),
    (0, lubejs_1.column)(),
    __metadata("design:type", Date)
], Order.prototype, "date", void 0);
__decorate([
    (0, lubejs_1.index)(),
    (0, lubejs_1.comment)('OrderNo'),
    (0, lubejs_1.autogen)((item) => 'abc'),
    (0, lubejs_1.column)(lubejs_1.DbType.string(20)),
    __metadata("design:type", String)
], Order.prototype, "orderNo", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('Description'),
    (0, lubejs_1.nullable)(),
    __metadata("design:type", String)
], Order.prototype, "description", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('Rowflag'),
    (0, lubejs_1.rowflag)(),
    __metadata("design:type", Object)
], Order.prototype, "rowflag", void 0);
__decorate([
    (0, relation_decorators_1.detail)(),
    (0, lubejs_1.oneToMany)(() => order_detail_1.OrderDetail, p => p.order),
    __metadata("design:type", Array)
], Order.prototype, "details", void 0);
exports.Order = Order = __decorate([
    (0, lubejs_1.table)(),
    (0, lubejs_1.context)(() => index_1.DB),
    (0, lubejs_1.comment)('Order')
], Order);
//# sourceMappingURL=order.js.map