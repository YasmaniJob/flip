# Instrucciones para Limpiar el Monorepo

## ⚠️ IMPORTANTE
Hay un proceso de Vercel CLI bloqueando la terminal. Sigue estos pasos manualmente:

## PASO 1: Eliminar apps/api

### Opción A: Ejecutar el script batch
```
Doble click en: 1-eliminar-apps-api.bat
```

### Opción B: Comando manual en PowerShell
```powershell
Remove-Item -Path "apps\api" -Recurse -Force
```

### Opción C: Eliminar manualmente
1. Abre el Explorador de Windows
2. Navega a `E:\Aplicaciones\flip-v2\apps\`
3. Elimina la carpeta `api`

## PASO 2: Verificar que se eliminó

Ejecuta en PowerShell:
```powershell
Get-ChildItem apps
```

Deberías ver solo:
```
apps/web/
```

## PASO 3: Commit y Push

### Opción A: Ejecutar el script batch
```
Doble click en: 2-commit-y-push.bat
```

### Opción B: Comandos manuales
```bash
git add .
git commit -m "Clean monorepo: remove unused apps/api"
git push
```

## PASO 4: Deploy en Vercel

1. Ve a: https://vercel.com/new
2. Importa el repositorio: `YasmaniJob/flip`
3. Configura:
   - **Root Directory:** `apps/web`
   - **Framework:** Next.js
   - **Build Command:** `pnpm build`
   - **Install Command:** `pnpm install`

4. Agrega las variables de entorno (ver `DEPLOYMENT_INSTRUCTIONS.md`)

5. Click en **Deploy**

## ✅ Verificación

Después de eliminar apps/api, verifica:
- [ ] `apps/api` ya no existe
- [ ] `apps/web` sigue existiendo
- [ ] Git commit exitoso
- [ ] Git push exitoso
- [ ] Listo para deploy en Vercel

## 📝 Notas

- **apps/api** contenía ~500 archivos que ya no se usan
- **apps/web** es completamente independiente
- **packages/shared** se mantiene (apps/web lo usa)
- El build será más rápido sin apps/api
