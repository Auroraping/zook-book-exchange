$ErrorActionPreference = 'Stop'

$envPath = Join-Path $PSScriptRoot '.env.local'
$model = 'deepseek-v4-pro'
$secureKey = Read-Host '请输入 DeepSeek API Key' -AsSecureString
$plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
)

if ([string]::IsNullOrWhiteSpace($plainKey)) {
  throw 'DeepSeek API Key 不能为空'
}

Set-Content -LiteralPath $envPath -Value @(
  "DEEPSEEK_API_KEY=$plainKey",
  "DEEPSEEK_MODEL=$model"
) -Encoding UTF8

Write-Host "已写入 $envPath"
Write-Host '现在可以运行 npm start 启动后端。'
