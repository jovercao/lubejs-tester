[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [switch]$Decorator,
  [switch]$Configure,
  [switch]$Mssql,
  [switch]$Mysql
)

if ($Mssql -and $Configure) {
  # npx cross-env LUBEJS_TEST_KIND=configure LUBEJS_TEST_DRIVER=mssql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Mssql -and $Decorator) {
  npx cross-env LUBEJS_TEST_KIND=decorator LUBEJS_TEST_DRIVER=mssql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Mysql -and $Configure) {
  Write-Host 3;
  # npx cross-env LUBEJS_TEST_KIND=configure LUBEJS_TEST_DRIVER=mysql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Mysql -and $Decorator) {
  Write-Host 4;
  # npx cross-env LUBEJS_TEST_KIND=decorator LUBEJS_TEST_DRIVER=mysql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}
