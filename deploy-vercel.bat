@echo off
echo ========================================
echo FLIP V2 - Deploy Automatico a Vercel
echo ========================================
echo.

echo [1/6] Habilitando ejecucion de scripts...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
if %errorlevel% neq 0 (
    echo ERROR: No se pudo cambiar la politica de ejecucion
    echo Ejecuta este script como Administrador
    pause
    exit /b 1
)
echo OK - Scripts habilitados
echo.

echo [2/6] Instalando Vercel CLI...
call npm install -g vercel
if %errorlevel% neq 0 (
    echo ERROR: No se pudo instalar Vercel CLI
    pause
    exit /b 1
)
echo OK - Vercel CLI instalado
echo.

echo [3/6] Verificando instalacion...
call vercel --version
echo.

echo [4/6] Iniciando sesion en Vercel...
echo IMPORTANTE: Se abrira tu navegador para autenticarte
echo.
pause
call vercel login
if %errorlevel% neq 0 (
    echo ERROR: No se pudo iniciar sesion
    pause
    exit /b 1
)
echo OK - Sesion iniciada
echo.

echo [5/6] Haciendo deploy inicial...
echo.
echo Responde las preguntas:
echo - Set up and deploy? YES
echo - Which scope? [tu cuenta]
echo - Link to existing project? NO
echo - Project name? flip-v2
echo - Directory? ./ (presiona Enter)
echo.
pause
call vercel
if %errorlevel% neq 0 (
    echo ERROR: Deploy fallo
    pause
    exit /b 1
)
echo OK - Deploy inicial completado
echo.

echo [6/6] Configurando variables de entorno...
echo.
echo Ahora vamos a configurar las variables de entorno
echo Copia y pega cada valor cuando se te pida
echo.
pause

echo Configurando DATABASE_URL...
call vercel env add DATABASE_URL production
echo.

echo Configurando TURSO_DATABASE_URL...
call vercel env add TURSO_DATABASE_URL production
echo.

echo Configurando TURSO_AUTH_TOKEN...
call vercel env add TURSO_AUTH_TOKEN production
echo.

echo Configurando BETTER_AUTH_SECRET...
call vercel env add BETTER_AUTH_SECRET production
echo.

echo Configurando NEXT_PUBLIC_APP_URL...
call vercel env add NEXT_PUBLIC_APP_URL production
echo.

echo Configurando NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION...
call vercel env add NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION production
echo.

echo ========================================
echo DEPLOY A PRODUCCION
echo ========================================
echo.
echo Haciendo deploy final con todas las variables...
pause
call vercel --prod
if %errorlevel% neq 0 (
    echo ERROR: Deploy a produccion fallo
    pause
    exit /b 1
)

echo.
echo ========================================
echo DEPLOY COMPLETADO!
echo ========================================
echo.
echo Tu aplicacion esta disponible en:
call vercel ls
echo.
pause
