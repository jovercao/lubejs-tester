/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createLube,
  Decimal,
  outputCommand,
} from "lubejs";
import "lubejs-mssql";

function typeOf(value: any): string {
  if (value instanceof Decimal) {
    return 'decimal(18, 6)'
  }

  if (typeof value === 'number') {
    if (Math.floor(value) === value) {
      return 'int'
    }
    return 'float'
  }

  if (typeof value === 'bigint') {
    return 'bigint'
  }
  throw new Error('不能识别的类型')
}

const INT32_MAX_VALUE = 2147483647;


(async () => {
  // 创建一个Lube连接
  const db = await createLube("mssql://sa:!crgd-2021@rancher.vm/Test");
  // 打开连接
  await db.open();
    
  const runTest = async (operator: string, left: any, right: any) => {
    const leftType = typeOf(left)
    const rightType = typeOf(right)
    const value = await db.queryScalar(`select f1 = cast(${left.toString()} as ${leftType}) ${operator} cast(${right.toString()} as ${rightType})`)

    console.log(`${left.toString()}[${leftType}] ${operator} ${right.toString()}[${rightType}] = ${value.toString()}[${typeOf(value)}]`)
  }

  // 输出日志
  // db.on('command', outputCommand)
  try {
    await runTest('+', 18n, INT32_MAX_VALUE)
    await runTest('+', INT32_MAX_VALUE, 18n)
    await runTest('+', new Decimal('100.11101'), INT32_MAX_VALUE)
    await runTest('+', new Decimal('200.11101'), 100.00011)
    await runTest('+', new Decimal('200.11101'), 100n)
  } finally {
    await db.close();
  }
})();
