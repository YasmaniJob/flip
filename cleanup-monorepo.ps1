# Script para limpiar el monorepo antes del deploy

Write-Host "=== LIMPIEZA DEL MONOREPO ===" -ForegroundColor Cyan
Write-Host ""

# 1. Eliminar apps/api
if (Test-Path "apps/api") {
    Write-Host "Eliminando apps/api..." -ForegroundColor Yellow
    Remove-Item -Path "apps/api" -Recurse -Force
    Write-Host "✓ apps/api eliminado" -ForegroundColor Green
} else {
    Write-Host "✓ apps/api ya no existe" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== LIMPIEZA COMPLETADA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: Actualizar turbo.json" -ForegroundColor Cyan
