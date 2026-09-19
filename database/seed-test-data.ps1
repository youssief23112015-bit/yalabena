param(
    [string]$ContainerName = "speakup-postgres",
    [string]$DbUser = "postgres",
    [string]$DbName = "speakup_tms"
)

$ErrorActionPreference = "Stop"

$SeedSql = Join-Path $PSScriptRoot "seed-test-data.sql"

if (-not (Test-Path $SeedSql)) {
    throw "Seed SQL not found: $SeedSql"
}

$running = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $ContainerName
if (-not $running) {
    throw "Container '$ContainerName' is not running."
}

Write-Host ""
Write-Host "=== SpeakUp TMS CLEAN SEED ===" -ForegroundColor Cyan

Write-Host "Checking that the database matches the official schema..." -ForegroundColor Yellow

$checkSql = @"
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'invoice_items'
              AND column_name = 'inventory_item_id'
        )
        AND EXISTS (
            SELECT 1
            FROM pg_type
            WHERE typname = 'invoice_item_type'
        )
        THEN 1
        ELSE 0
    END AS schema_ok;
"@

$schemaOk = (
    $checkSql |
        docker exec -i $ContainerName psql `
            -U $DbUser `
            -d $DbName `
            -t `
            -A `
            -v ON_ERROR_STOP=1
) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" } | Select-Object -Last 1

if ($LASTEXITCODE -ne 0) {
    throw "Schema check failed."
}

if ($schemaOk -ne "1") {
    throw "Database schema is not the official SpeakUp TMS schema. Run .\reset-and-seed.ps1 first."
}

Write-Host "Schema check passed." -ForegroundColor Green

Write-Host "Executing clean seed..." -ForegroundColor Yellow

Get-Content $SeedSql -Raw |
    docker exec -i $ContainerName psql `
        -U $DbUser `
        -d $DbName `
        -v ON_ERROR_STOP=1

$ec = $LASTEXITCODE

if ($ec -ne 0) {
    throw "Seed failed with exit code $ec"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " CLEAN TEST SEED COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
