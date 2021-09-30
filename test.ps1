param(
  [string[]]$kinds,
  [string[]]$dirvers
)

npx cross-env LUBEJS_TEST_KIND=configure LUBEJS_TEST_DRIVER=mssql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
npx cross-env LUBEJS_TEST_KIND=decorator LUBEJS_TEST_DRIVER=mssql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
