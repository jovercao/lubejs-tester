$startdir = Get-Location

# pnpm un lubejs lubejs-mssql
if (test-path .\node_modules\lubejs-mssql) {
  # Remove-Item -Recurse -Force .\node_modules\lubejs-mssql
  pnpm uninstall lubejs-mssql
}
if (test-path .\node_modules\lubejs) {
  #  Remove-Item -Recurse -Force .\node_modules\lubejs
  pnpm uninstall lubejs
}

Set-Location "$startdir/../lubejs"
pnpm run build
$lubeVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location "$startdir/../lubejs-mssql/"
pnpm run build
$driverVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location $startdir
pnpm i "$startdir/../lubejs/dist/lubejs-$lubeVersion.tgz"
pnpm i "$startdir/../lubejs-mssql/dist/lubejs-mssql-$driverVersion.tgz"
