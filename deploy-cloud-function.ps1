# WeChat Mini-Program Cloud Function Deployment Script
# This script helps deploy the fetchWechatArticles cloud function

Write-Host "=== WeChat Mini-Program Cloud Function Deployment ===" -ForegroundColor Green
Write-Host "Cloud Function: fetchWechatArticles" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
$currentPath = Get-Location
Write-Host "Current directory: $currentPath" -ForegroundColor Yellow

# Check if cloud function directory exists
$functionPath = Join-Path $currentPath "cloudfunctions\fetchWechatArticles"
if (-not (Test-Path $functionPath)) {
    Write-Host "ERROR: Cloud function directory not found: $functionPath" -ForegroundColor Red
    Write-Host "Please ensure the fetchWechatArticles cloud function exists." -ForegroundColor Red
    exit 1
}

Write-Host "Cloud function directory found: $functionPath" -ForegroundColor Green
Write-Host ""

# Check if package.json exists
$packageJsonPath = Join-Path $functionPath "package.json"
if (-not (Test-Path $packageJsonPath)) {
    Write-Host "ERROR: package.json not found in cloud function directory" -ForegroundColor Red
    exit 1
}

Write-Host "package.json found" -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
$nodeModulesPath = Join-Path $functionPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    Set-Location $functionPath
    npm install
    Set-Location $currentPath
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""
}

Write-Host "=== Deployment Instructions ===" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy the cloud function, please follow these steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open WeChat Developer Tools" -ForegroundColor White
Write-Host "2. Open your Mini-Program project" -ForegroundColor White
Write-Host "3. Go to Cloud Development -> Cloud Functions" -ForegroundColor White
Write-Host "4. Find 'fetchWechatArticles' in the function list" -ForegroundColor White
Write-Host "5. Right-click the function and select 'Upload and Deploy'" -ForegroundColor White
Write-Host "6. Wait for the deployment to complete" -ForegroundColor White
Write-Host ""
Write-Host "=== Environment Variables Configuration ===" -ForegroundColor Green
Write-Host ""
Write-Host "After deployment, configure these environment variables in the cloud console:" -ForegroundColor Cyan
Write-Host "1. DB_HOST: Your MySQL database host" -ForegroundColor White
Write-Host "2. DB_PORT: Your MySQL database port (default: 3306)" -ForegroundColor White
Write-Host "3. DB_USER: Your MySQL database username" -ForegroundColor White
Write-Host "4. DB_PASSWORD: Your MySQL database password" -ForegroundColor White
Write-Host "5. DB_NAME: Your MySQL database name" -ForegroundColor White
Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Green
Write-Host ""
Write-Host "After deployment and configuration, test the function:" -ForegroundColor Cyan
Write-Host "1. In the cloud console, test the function with action 'fetch'" -ForegroundColor White
Write-Host "2. Check the logs for any errors" -ForegroundColor White
Write-Host "3. Verify that articles are being saved to the database" -ForegroundColor White
Write-Host ""
Write-Host "Deployment script completed." -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")