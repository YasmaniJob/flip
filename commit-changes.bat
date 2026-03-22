@echo off
echo === COMMIT DE CAMBIOS ===
echo.

echo Verificando estado de git...
git status
echo.

echo Agregando todos los cambios...
git add .
echo.

echo Haciendo commit...
git commit -m "Clean monorepo: remove unused apps/api and add deployment scripts"
echo.

echo Estado final:
git status
echo.

echo === COMPLETADO ===
echo.
echo Ahora ejecuta: git push
echo.
pause
