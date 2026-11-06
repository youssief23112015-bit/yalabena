param(
    [string]$ContainerName = "speakup-postgres",
    [string]$DbUser = "postgres",
    [string]$DbName = "speakup_tms"
)

$ErrorActionPreference = "Stop"

$SchemaSql = Join-Path $PSScriptRoot "speakup_tms_full_schema.sql"
$SeedSql   = Join-Path $PSScriptRoot "seed-test-data.sql"
$BackupDir = Join-Path $PSScriptRoot "backups"

Write-Host ""
Write-Host "=== SpeakUp TMS DATABASE RESET + CLEAN SEED ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $SchemaSql)) {
    throw "Schema SQL not found: $SchemaSql"
}

if (-not (Test-Path $SeedSql)) {
    throw "Seed SQL not found: $SeedSql"
}

$running = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $ContainerName
if (-not $running) {
    throw "Container '$ContainerName' is not running."
}

# Always take a plain-SQL backup before destructive reset.
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupSql = Join-Path $BackupDir "speakup_tms_$stamp.sql"

Write-Host "Creating backup: $BackupSql" -ForegroundColor Yellow

docker exec $ContainerName pg_dump `
    -U $DbUser `
    -d $DbName `
    --no-owner `
    --no-privileges |
    Set-Content -Path $BackupSql -Encoding UTF8

if ($LASTEXITCODE -ne 0) {
    throw "pg_dump failed with exit code $LASTEXITCODE"
}

Write-Host "Backup completed." -ForegroundColor Green
Write-Host ""
Write-Host "WARNING: The next step DROPS SCHEMA public CASCADE." -ForegroundColor Red
Write-Host "This deletes the current local database objects/data in '$DbName'." -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Type RESET to continue"
if ($confirm -ne "RESET") {
    Write-Host "Reset cancelled. No database changes were made." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Resetting public schema..." -ForegroundColor Yellow

$resetSql = @"
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public AUTHORIZATION $DbUser;
GRANT ALL ON SCHEMA public TO $DbUser;
GRANT ALL ON SCHEMA public TO public;
"@

$resetSql |
    docker exec -i $ContainerName psql `
        -U $DbUser `
        -d $DbName `
        -v ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
    throw "Database reset failed with exit code $LASTEXITCODE"
}

Write-Host "Applying official schema with strict error handling..." -ForegroundColor Yellow

Get-Content $SchemaSql -Raw |
    docker exec -i $ContainerName psql `
        -U $DbUser `
        -d $DbName `
        -v ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
    throw "Schema application failed with exit code $LASTEXITCODE. Restore the backup if needed: $BackupSql"
}

Write-Host "Schema applied successfully." -ForegroundColor Green

Write-Host "Applying clean test seed..." -ForegroundColor Yellow

Get-Content $SeedSql -Raw |
    docker exec -i $ContainerName psql `
        -U $DbUser `
        -d $DbName `
        -v ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
    throw "Seed failed with exit code $LASTEXITCODE. Restore the backup if needed: $BackupSql"
}

Write-Host "Seed applied successfully." -ForegroundColor Green

Write-Host ""
Write-Host "Running verification..." -ForegroundColor Yellow

docker exec $ContainerName psql `
    -U $DbUser `
    -d $DbName `
    -c "SELECT 'tables' AS metric, COUNT(*)::text AS value FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'
        UNION ALL
        SELECT 'courses', COUNT(*)::text FROM courses
        UNION ALL
        SELECT 'students', COUNT(*)::text FROM students
        UNION ALL
        SELECT 'invoices', COUNT(*)::text FROM invoices
        UNION ALL
        SELECT 'invoice_items', COUNT(*)::text FROM invoice_items
        UNION ALL
        SELECT 'inventory_items', COUNT(*)::text FROM inventory_items;"

if ($LASTEXITCODE -ne 0) {
    throw "Verification failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " DATABASE + SCHEMA + SEED READY" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "Backup: $BackupSql" -ForegroundColor Cyan
