# AI 心理健康管理平台 — 一键开发启动脚本
# 同时启动前端 (Vite) 和后端 (NestJS)

$RootDir = Split-Path -Parent $PSScriptRoot
$ServerDir = Join-Path $RootDir "server"
$FrontendDir = $RootDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI 心理健康管理平台 — 开发启动"       -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查依赖
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js >= 18" -ForegroundColor Red
    exit 1
}
Write-Host "[Node] $nodeVersion" -ForegroundColor Green

# 检查前端依赖
if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "[前端] 安装依赖中..." -ForegroundColor Yellow
    Push-Location $FrontendDir
    npm install
    Pop-Location
}

# 检查后端依赖
if (-not (Test-Path (Join-Path $ServerDir "node_modules"))) {
    Write-Host "[后端] 安装依赖中..." -ForegroundColor Yellow
    Push-Location $ServerDir
    npm install
    Pop-Location
}

# 生成 Prisma Client + 执行 Migration
Write-Host "[数据库] 确保 Prisma 已是最新..." -ForegroundColor Yellow
Push-Location $ServerDir
npx prisma generate
npx prisma db push --accept-data-loss 2>$null
npx prisma db seed 2>$null
Pop-Location

Write-Host ""
Write-Host "正在启动服务（按 Ctrl+C 停止所有服务）..." -ForegroundColor Cyan
Write-Host ""

# 检查 AI API Key 配置
$envFile = Join-Path $ServerDir ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match 'DEEPSEEK_API_KEY=(?!\s*$)(?!sk-your-key)') {
        Write-Host "  [AI] 已配置 API Key，使用真实 AI 模型" -ForegroundColor Green
    } else {
        Write-Host "  [AI] 未检测到 API Key，使用 Mock AI 模式（无需配置即可演示）" -ForegroundColor Yellow
        Write-Host "  [AI] 如需接入真实 AI，编辑 server/.env 设置 DEEPSEEK_API_KEY" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [AI] 未检测到 .env 文件，使用 Mock AI 模式" -ForegroundColor Yellow
}

# 启动前端和后端
$frontendJob = Start-Job -Name "frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $FrontendDir

$backendJob = Start-Job -Name "backend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run start:dev
} -ArgumentList $ServerDir

Write-Host "  前端: http://localhost:5173" -ForegroundColor Green
Write-Host "  后端: http://localhost:8000" -ForegroundColor Green
Write-Host "  Swagger: http://localhost:8000/api/docs" -ForegroundColor Green
Write-Host ""

try {
    # 等待任一 Job 完成（通常是 Ctrl+C 导致）
    while ($true) {
        $frontendState = $frontendJob | Receive-Job
        if ($frontendState) { Write-Host $frontendState }
        $backendState = $backendJob | Receive-Job
        if ($backendState) { Write-Host $backendState }
        Start-Sleep -Seconds 1

        $hasFailed = ($frontendJob.State -eq 'Failed') -or ($backendJob.State -eq 'Failed')
        $hasCompleted = ($frontendJob.State -eq 'Completed') -and ($backendJob.State -eq 'Completed')
        if ($hasFailed -or $hasCompleted) { break }
    }
}
finally {
    Write-Host "`n正在停止所有服务..." -ForegroundColor Yellow
    $frontendJob | Stop-Job -PassThru | Remove-Job
    $backendJob | Stop-Job -PassThru | Remove-Job
    Write-Host "服务已停止。" -ForegroundColor Green
}
