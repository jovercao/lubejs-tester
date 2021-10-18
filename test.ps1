param(
  [string[]]$kinds,
  [string[]]$dirvers
)

if (!$kinds) {
  $kinds = @('configure', 'decorator')
}
foreach ($kind in $kinds) {
  npx cross-env LUBEJS_TEST_KIND=$kind LUBEJS_TEST_DRIVER=mssql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}
