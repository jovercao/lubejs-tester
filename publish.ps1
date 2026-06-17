param(
  [Parameter(Mandatory = $True)]
  [string]$Version,
  [string]$Message
)

$startdir = Get-Location;

###########################发布lubejs#############################
Set-Location "$startdir/../lubejs";

$package = ((Get-Content "package.json") | ConvertFrom-Json);

Write-Host "当前版本： $($package.version)"
Write-Host "发布版本： $Version"

if (($Version -lt $package.version.ToString()) -or ($package.version.Trim() -eq $Version)) {
  cd $startdir;
  throw '发布版本号错误：版本号不能低于或者等于当前版本！'
}

$package.version = $Version;

ConvertTo-Json $package | Out-File -Encoding utf8 'package.json';

if (-not $Message) {
  $Message = $Version
}

# 写入版本日志
Out-File -Append -Encoding utf8 -FilePath update-log.md -InputObject "
## $Version
$Message
"

npm run build;
npm run doc;

git add .;
git commit -m $Message;
git tag $Version;

git push origin master;
git push origin $Version;

git push gitee master;
git push gitee $Version;

Set-Location "$startdir/../lubejs/dist";
npm publish;


###########################发布lubejs-mssql#############################
Set-Location "$startdir/../lubejs-mssql";

$package = ((Get-Content "package.json") | ConvertFrom-Json);

Write-Host $Version
Write-Host $package.version

if (($Version -lt $package.version.ToString()) -or ($package.version.Trim() -eq $Version)) {
  throw '发布版本号错误：版本号不能低于或者等于当前版本！'
}

$package.version = $Version;

ConvertTo-Json $package | Out-File -Encoding utf8 'package.json';

if (-not $Message) {
  $Message = $Version
}

# 写入版本日志
Out-File -Append -Encoding utf8 -FilePath update-log.md -InputObject "
## $Version
$Message
"

npm run build;

git add .;
git commit -m $Message;
git tag $Version;

git push origin master;
git push origin $Version;

git push gitee master;
git push gitee $Version;

Set-Location "$startdir/../lubejs-mssql/dist";
npm publish;

Set-Location $startdir;
