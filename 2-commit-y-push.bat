@echo off
echo === COMMIT Y PUSH DE CAMBIOS ===
echo.

echo Agregando cambios a git...
git add .

echo.
echo Haciendo commit...
git commit -m "Clean monorepo: remove unused apps/api"

echo.
echo Haciendo push a GitHub...
git push

echo.
echo === COMPLETADO ===
echo.
echo El codigo esta listo para deploy en Vercel!
echo Ve a: https://vercel.com/new
echo.
pause
