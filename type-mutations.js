"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const lubejs_1 = require("lubejs");
require("lubejs-mssql");
function typeOf(value) {
    if (value instanceof lubejs_1.Decimal) {
        return 'decimal(18, 6)';
    }
    if (typeof value === 'number') {
        if (Math.floor(value) === value) {
            return 'int';
        }
        return 'float';
    }
    if (typeof value === 'bigint') {
        return 'bigint';
    }
    throw new Error('不能识别的类型');
}
const INT32_MAX_VALUE = 2147483647;
(async () => {
    // 创建一个Lube连接
    const db = await (0, lubejs_1.createConnection)("mssql://sa:!crgd-2021@rancher.vm/Test");
    // 打开连接
    await db.open();
    const runTest = async (operator, left, right) => {
        const leftType = typeOf(left);
        const rightType = typeOf(right);
        const value = await db.queryScalar(`select f1 = cast(${left.toString()} as ${leftType}) ${operator} cast(${right.toString()} as ${rightType})`);
        console.log(`${left.toString()}[${leftType}] ${operator} ${right.toString()}[${rightType}] = ${value.toString()}[${typeOf(value)}]`);
    };
    // 输出日志
    // db.on('command', outputCommand)
    try {
        await runTest('+', 18n, INT32_MAX_VALUE);
        await runTest('+', INT32_MAX_VALUE, 18n);
        await runTest('+', new lubejs_1.Decimal('100.11101'), INT32_MAX_VALUE);
        await runTest('+', new lubejs_1.Decimal('200.11101'), 100.00011);
        await runTest('+', new lubejs_1.Decimal('200.11101'), 100n);
    }
    finally {
        await db.close();
    }
})();
//# sourceMappingURL=type-mutations.js.map