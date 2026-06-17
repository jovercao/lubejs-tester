[CmdletBinding(SupportsShouldProcess=$true)]
param(
  [switch]$Decorator,
  [switch]$Configure,
  [switch]$Mssql,
  [switch]$Mysql,
  [switch]$Sqlite
)

if ($Mssql -and $Configure) {
  # --trace-uncaught
  npx cross-env LUBEJS_TEST_KIND=configure LUBEJS_TEST_DRIVER=mssql node --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Mssql -and $Decorator) {
  # --trace-uncaught
  npx cross-env LUBEJS_TEST_KIND=decorator LUBEJS_TEST_DRIVER=mssql node --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Mysql -and $Configure) {
  Write-Host 'Mysql Configure';
  # npx cross-env LUBEJS_TEST_KIND=configure LUBEJS_TEST_DRIVER=mysql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Mysql -and $Decorator) {
  Write-Host 'Mysql Decorator';
  # npx cross-env LUBEJS_TEST_KIND=decorator LUBEJS_TEST_DRIVER=mysql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Sqlite -and $Configure) {
  Write-Host 'Sqlite Configure';
  # npx cross-env LUBEJS_TEST_KIND=configure LUBEJS_TEST_DRIVER=mysql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}

if ($Sqlite -and $Decorator) {
  Write-Host 'Sqlite Decorator';
  # npx cross-env LUBEJS_TEST_KIND=decorator LUBEJS_TEST_DRIVER=mysql node --trace-uncaught --require ts-node/register --require ./bootstrap.js node_modules/mocha/bin/_mocha --extension ts --extension js tests/**/*.test.ts
}
