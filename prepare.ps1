$startdir = Get-Location

npm un lubejs lubejs-mssql

Set-Location "$startdir/../lubejs"
tsc
npm pack
$lubeVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location "$startdir/../lubejs-mssql/"
tsc
npm pack
$driverVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location $startdir
npm i "$startdir/../lubejs/lubejs-$lubeVersion.tgz"
npm i "$startdir/../lubejs-mssql/lubejs-mssql-$driverVersion.tgz"
