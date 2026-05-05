# Script completo para preparar el proyecto para deploy en Vercel

Write-Host "=== PREPARANDO PROYECTO PARA DEPLOY EN VERCEL ===" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Eliminar apps/api
Write-Host "PASO 1: Eliminando apps/api..." -ForegroundColor Yellow
if (Test-Path "apps/api") {
    Remove-Item -Path "apps/api" -Recurse -Force -ErrorAction Stop
    Write-Host "✓ apps/api eliminado exitosamente" -ForegroundColor Green
} else {
    Write-Host "✓ apps/api ya no existe" -ForegroundColor Green
}
Write-Host ""

# PASO 2: Verificar que apps/web existe
Write-Host "PASO 2: Verificando apps/web..." -ForegroundColor Yellow
if (Test-Path "apps/web") {
    Write-Host "✓ apps/web existe" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: apps/web no existe!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# PASO 3: Verificar package.json de apps/web
Write-Host "PASO 3: Verificando configuración de apps/web..." -ForegroundColor Yellow
if (Test-Path "apps/web/package.json") {
    Write-Host "✓ apps/web/package.json existe" -ForegroundColor Green
} else {
    Write-Host "✗ ERROR: apps/web/package.json no existe!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# PASO 4: Verificar vercel.json
Write-Host "PASO 4: Verificando vercel.json..." -ForegroundColor Yellow
if (Test-Path "vercel.json") {
    Write-Host "✓ vercel.json existe" -ForegroundColor Green
} else {
    Write-Host "⚠ vercel.json no existe (se creará en Vercel)" -ForegroundColor Yellow
}
Write-Host ""

# PASO 5: Listar estructura final
Write-Host "PASO 5: Estructura final del monorepo:" -ForegroundColor Yellow
Write-Host ""
Get-ChildItem -Directory | Where-Object { $_.Name -in @('apps', 'packages', 'docs') } | ForEach-Object {
    Write-Host "  $($_.Name)/" -ForegroundColor Cyan
    Get-ChildItem $_.FullName -Directory | ForEach-Object {
        Write-Host "    $($_.Name)/" -ForegroundColor Gray
    }
}
Write-Host ""

# PASO 6: Preparar commit
Write-Host "PASO 6: Estado de Git:" -ForegroundColor Yellow
git status --short
Write-Host ""

Write-Host "=== PREPARACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Siguientes pasos:" -ForegroundColor Cyan
Write-Host "1. Revisar los cambios con: git status" -ForegroundColor White
Write-Host "2. Hacer commit: git add . && git commit -m 'Clean monorepo: remove apps/api'" -ForegroundColor White
Write-Host "3. Push: git push" -ForegroundColor White
Write-Host "4. Deploy en Vercel: https://vercel.com/new" -ForegroundColor White
Write-Host ""
