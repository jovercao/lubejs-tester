$startdir = Get-Location

# npm un lubejs lubejs-mssql
if (test-path .\node_modules\lubejs-mssql) {
  # Remove-Item -Recurse -Force .\node_modules\lubejs-mssql
  npm uninstall lubejs-mssql
}
if (test-path .\node_modules\lubejs) {
  #  Remove-Item -Recurse -Force .\node_modules\lubejs
  npm uninstall lubejs
}

Set-Location "$startdir/../lubejs"
npm run build
$lubeVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location "$startdir/../lubejs-mssql/"
npm run build
$driverVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location $startdir
npm i "$startdir/../lubejs/dist/lubejs-$lubeVersion.tgz"
npm i "$startdir/../lubejs-mssql/dist/lubejs-mssql-$driverVersion.tgz"
