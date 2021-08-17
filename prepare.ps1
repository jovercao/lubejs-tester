

$startdir = pwd

npm un lubejs lubejs-mssql

cd "$startdir/../lubejs-mssql/"

tsc
npm pack
$driverVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

cd "$startdir/../lubejs"
tsc
npm pack
$lubeVersion = ((Get-Content "package.json") | ConvertFrom-Json).version

cd $startdir

npm i "$startdir/../lubejs/lubejs-3.0.0-preview.tgz"
npm i "$startdir/../lubejs-mssql/lubejs-mssql-3.0.0-preview.tgz"
