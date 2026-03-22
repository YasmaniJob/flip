@echo off
cls
echo ========================================
echo   PREPARACION COMPLETA PARA VERCEL
echo ========================================
echo.

REM PASO 1: Eliminar apps/api si existe
echo [1/4] Eliminando apps/api...
if exist "apps\api" (
    rmdir /s /q "apps\api"
    echo       OK - apps/api eliminado
) else (
    echo       OK - apps/api ya no existe
)
echo.

REM PASO 2: Verificar estructura
echo [2/4] Verificando estructura...
if exist "apps\web" (
    echo       OK - apps/web existe
) else (
    echo       ERROR - apps/web no existe!
    pause
    exit /b 1
)
echo.

REM PASO 3: Git add y commit
echo [3/4] Haciendo commit...
git add .
git commit -m "Clean monorepo: remove unused apps/api and prepare for Vercel deploy"
echo       OK - Commit realizado
echo.

REM PASO 4: Git push
echo [4/4] Haciendo push a GitHub...
git push
echo       OK - Push completado
echo.

echo ========================================
echo   PREPARACION COMPLETADA
echo ========================================
echo.
echo El proyecto esta listo para deploy en Vercel!
echo.
echo SIGUIENTE PASO:
echo.
echo 1. Ve a: https://vercel.com/new
echo 2. Importa: YasmaniJob/flip
echo 3. Root Directory: apps/web
echo 4. Framework: Next.js
echo 5. Agrega variables de entorno (ver DEPLOYMENT_INSTRUCTIONS.md)
echo 6. Click en Deploy
echo.
echo ========================================
pause
