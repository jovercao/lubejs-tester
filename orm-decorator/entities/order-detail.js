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
exports.OrderDetail = void 0;
const index_1 = require("../index");
const lubejs_1 = require("lubejs");
const order_1 = require("./order");
/**
 * OrderDetail
 */
let OrderDetail = class OrderDetail extends lubejs_1.Entity {
};
exports.OrderDetail = OrderDetail;
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('ID'),
    (0, lubejs_1.identity)(),
    (0, lubejs_1.key)(),
    __metadata("design:type", BigInt)
], OrderDetail.prototype, "id", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('ProductName'),
    __metadata("design:type", String)
], OrderDetail.prototype, "product", void 0);
__decorate([
    (0, lubejs_1.comment)('Quantity'),
    (0, lubejs_1.column)(),
    __metadata("design:type", Number)
], OrderDetail.prototype, "count", void 0);
__decorate([
    (0, lubejs_1.comment)('Price'),
    (0, lubejs_1.column)(lubejs_1.DbType.decimal(18, 6)),
    __metadata("design:type", lubejs_1.Decimal)
], OrderDetail.prototype, "price", void 0);
__decorate([
    (0, lubejs_1.comment)('Amount'),
    (0, lubejs_1.column)(lubejs_1.DbType.decimal(18, 2)),
    __metadata("design:type", lubejs_1.Decimal)
], OrderDetail.prototype, "amount", void 0);
__decorate([
    (0, lubejs_1.column)(),
    (0, lubejs_1.comment)('Description'),
    (0, lubejs_1.nullable)(),
    __metadata("design:type", String)
], OrderDetail.prototype, "description", void 0);
__decorate([
    (0, lubejs_1.comment)('OrderId'),
    (0, lubejs_1.column)(),
    __metadata("design:type", BigInt)
], OrderDetail.prototype, "orderId", void 0);
__decorate([
    (0, lubejs_1.foreignKey)('orderId'),
    (0, lubejs_1.manyToOne)(() => order_1.Order, p => p.details),
    __metadata("design:type", order_1.Order)
], OrderDetail.prototype, "order", void 0);
exports.OrderDetail = OrderDetail = __decorate([
    (0, lubejs_1.table)(),
    (0, lubejs_1.context)(() => index_1.DB),
    (0, lubejs_1.comment)('OrderDetail')
], OrderDetail);
//# sourceMappingURL=order-detail.js.map