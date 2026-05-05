@echo off
echo === PUSH A GITHUB ===
echo.

echo Haciendo push...
git push
echo.

echo === COMPLETADO ===
echo.
echo El codigo esta listo para deploy en Vercel!
echo.
echo Siguiente paso:
echo 1. Ve a: https://vercel.com/new
echo 2. Importa el repositorio: YasmaniJob/flip
echo 3. Configura Root Directory: apps/web
echo 4. Agrega las variables de entorno (ver DEPLOYMENT_INSTRUCTIONS.md)
echo 5. Click en Deploy
echo.
pause
