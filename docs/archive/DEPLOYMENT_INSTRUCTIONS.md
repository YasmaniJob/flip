# Instrucciones para Deploy en Vercel

## ✅ Completado
- [x] Código subido a GitHub: https://github.com/YasmaniJob/flip.git
- [x] Build local exitoso
- [x] Configuración de Vercel lista

## 🚀 Pasos para Deploy (Interfaz Web)

### 1. Ir a Vercel Dashboard
Abre en tu navegador: https://vercel.com/new

### 2. Importar desde GitHub
- Click en "Import Git Repository"
- Selecciona el repositorio: `YasmaniJob/flip`
- Click en "Import"

### 3. Configurar el Proyecto

**Framework Preset:** Next.js

**Root Directory:** `apps/web`

**Build Command:** `pnpm build`

**Output Directory:** `.next` (default)

**Install Command:** `pnpm install`

### 4. Configurar Variables de Entorno

Agrega estas variables en la sección "Environment Variables":

```
DATABASE_URL=postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

TURSO_DATABASE_URL=libsql://flip-v2-yasmanijob.aws-us-east-1.turso.io

TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQxNDQxNDksImlkIjoiMDE5ZDEzMzMtNzgwMS03Zjk0LTlhOGYtMDEyYTAxNWQxODhiIiwicmlkIjoiM2VhOGNmOTctNjM3NC00NjhjLTkxYzItMmYxYzUxM2IxNDQ2In0.zZdG69K6hhya1dc3B3eWWFpX6dImIxGUQ2uQjj9kISbXGoirD-4ZHbqBq3v1hqKPA-iGKb5f_BBqNlFxjBoGAQ

BETTER_AUTH_SECRET=4quRwA5VPAYmkvBkUWC4fsmQITeyypueF4b8yLKBp18=

BETTER_AUTH_URL=https://tu-proyecto.vercel.app

NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app

NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
```

**IMPORTANTE:** 
- Después del primer deploy, Vercel te dará una URL (ej: `flip-v2.vercel.app`)
- Actualiza `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` con esa URL
- Redeploy el proyecto

### 5. Deploy
- Click en "Deploy"
- Espera a que termine el build (puede tomar 3-5 minutos)

### 6. Verificar
- Una vez completado, Vercel te mostrará la URL de tu aplicación
- Visita la URL y verifica que funcione

## 🔧 Si hay errores en el build

1. Revisa los logs en Vercel
2. Los errores de TypeScript y ESLint están desactivados en `next.config.ts`
3. Si hay problemas con las variables de entorno, verifica que estén todas configuradas

## 📝 Notas

- El proyecto está configurado como monorepo
- Solo se despliega `apps/web`
- Las migraciones de base de datos ya están aplicadas
- Better Auth está configurado para no requerir verificación de email

## ✅ Checklist Final

- [ ] Proyecto importado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] URL actualizada en variables de entorno
- [ ] Redeploy completado
- [ ] Aplicación funcionando
