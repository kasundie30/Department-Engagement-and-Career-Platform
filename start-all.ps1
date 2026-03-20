$ErrorActionPreference = "Stop"

$rootDir = Get-Location

$services = @(
    "notification-service",
    "user-service",
    "feed-service",
    "job-service",
    "event-service",
    "research-service",
    "analytics-service",
    "messaging-service"
)

Write-Host "Starting all 8 services..." -ForegroundColor Cyan

foreach ($service in $services) {
    Write-Host "Starting $service..." -ForegroundColor Green
    $servicePath = Join-Path $rootDir "services\$service"
    
    # Start each service in a hidden background process
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run start:dev" -WorkingDirectory $servicePath
}

Write-Host "Starting Web App..." -ForegroundColor Green
$webPath = Join-Path $rootDir "web"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $webPath

Write-Host "Wait 15 seconds for services to fully initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

Write-Host "All services started!" -ForegroundColor Green
