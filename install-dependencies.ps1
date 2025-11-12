# 微信小程序云函数依赖安装脚本
# 请确保已安装 Node.js 和 npm

Write-Host "开始安装云函数依赖..."

# 获取当前脚本所在目录
$currentDir = Get-Location

# 定义需要安装依赖的云函数目录
$cloudFunctions = @(
    "cloudfunctions\getPhoneNumber",
    "cloudfunctions\phoneLogin", 
    "cloudfunctions\sendSmsCode",
    "cloudfunctions\wechatLogin",
    "cloudfunctions\check-env",
    "cloudfunctions\error-handler",
    "cloudfunctions\function-error-handler",
    "cloudfunctions\quickstartFunctions",
    "miniprogram\cloudfunctions\getPhoneNumber",
    "miniprogram\cloudfunctions\phoneLogin",
    "miniprogram\cloudfunctions\sendSmsCode",
    "miniprogram\cloudfunctions\smsLogin",
    "miniprogram\cloudfunctions\wechatLogin",
    "miniprogram\cloudfunctions\courseSign",
    "miniprogram\cloudfunctions\getCourses"
)

foreach ($function in $cloudFunctions) {
    $fullPath = Join-Path $currentDir.Path $function
    if (Test-Path $fullPath) {
        Write-Host "正在安装 $function 的依赖..."
        Set-Location $fullPath
        npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $function 依赖安装成功" -ForegroundColor Green
        } else {
            Write-Host "✗ $function 依赖安装失败" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠ $function 目录不存在" -ForegroundColor Yellow
    }
}

Set-Location $currentDir.Path
Write-Host "所有云函数依赖安装完成！"
Write-Host "现在可以重新部署云函数了。"