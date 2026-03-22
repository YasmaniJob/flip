@echo off
echo === ELIMINANDO apps/api ===
echo.

if exist "apps\api" (
    echo Eliminando apps\api...
    rmdir /s /q "apps\api"
    echo.
    echo [OK] apps/api eliminado exitosamente
) else (
    echo [OK] apps/api ya no existe
)

echo.
echo === COMPLETADO ===
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
