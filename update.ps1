$startdir = Get-Location

npm un lubejs lubejs-mssql

Set-Location "$startdir/../lubejs"
npm run build
$lubeVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location "$startdir/../lubejs-mssql/"
npm run build
$driverVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

Set-Location $startdir
npm i "$startdir/../lubejs/lubejs-$lubeVersion.tgz"
npm i "$startdir/../lubejs-mssql/lubejs-mssql-$driverVersion.tgz"
