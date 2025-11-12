# 微信小程序云函数部署脚本
Write-Host "准备重新部署云函数..." -ForegroundColor Cyan

# 检查云开发CLI是否安装
try {
    $cliCheck = cloudbase --version
    Write-Host "✓ 云开发CLI已安装: $cliCheck" -ForegroundColor Green
} catch {
    Write-Host "✗ 未找到云开发CLI，请先安装: npm install -g @cloudbase/cli" -ForegroundColor Red
    exit 1
}

# 登录云开发环境
Write-Host "请确保已登录云开发环境，执行: cloudbase login" -ForegroundColor Yellow

# 定义需要部署的云函数
$cloudFunctions = @(
    "cloudfunctions\getPhoneNumber",
    "cloudfunctions\phoneLogin", 
    "cloudfunctions\sendSmsCode",
    "cloudfunctions\wechatLogin",
    "cloudfunctions\check-env",
    "cloudfunctions\error-handler",
    "cloudfunctions\function-error-handler",
    "cloudfunctions\quickstartFunctions",
    "cloudfunctions\dailySign",
    "cloudfunctions\migrateToMysql"
)

Write-Host "开始部署云函数..." -ForegroundColor Cyan

foreach ($function in $cloudFunctions) {
    if (Test-Path $function) {
        Write-Host "正在部署 $function..." -ForegroundColor Yellow
        Set-Location $function
        
        # 检查node_modules是否存在
        if (-not (Test-Path "node_modules")) {
            Write-Host "  正在安装依赖..." -ForegroundColor Gray
            npm install
        }
        
        # 部署云函数
        cloudbase functions:deploy --name (Split-Path $function -Leaf)
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ 部署成功" -ForegroundColor Green
        } else {
            Write-Host "  ✗ 部署失败" -ForegroundColor Red
        }
        
        Set-Location (Split-Path $function -Parent)
    }
}

# 回到项目根目录，更新云函数运行时配置（环境变量等）
Set-Location (Split-Path $PSScriptRoot -Parent)
Write-Host "更新云函数配置（环境变量、运行时等）..." -ForegroundColor Cyan
cloudbase functions:config:update

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 云函数配置更新完成" -ForegroundColor Green
} else {
    Write-Host "✗ 云函数配置更新失败，请检查 cloudbaserc.json 与 .env.local" -ForegroundColor Red
}

Write-Host "云函数部署完成！现在可以测试功能了。" -ForegroundColor Green