# Script para deployment automático en Vercel
Write-Host "Iniciando deployment en Vercel..." -ForegroundColor Green

# Configurar variables de entorno necesarias
$env:VERCEL_ORG_ID = ""
$env:VERCEL_PROJECT_ID = ""

# Ejecutar vercel deploy
Write-Host "Ejecutando vercel deploy..." -ForegroundColor Yellow
vercel deploy --prod --yes

Write-Host "Deployment completado!" -ForegroundColor Green
