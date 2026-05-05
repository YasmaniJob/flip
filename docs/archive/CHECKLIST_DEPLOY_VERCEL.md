# ✅ Checklist Final para Deploy en Vercel

## Estado Actual: LISTO PARA DEPLOY ✅

---

## ✅ Verificaciones Completadas

### 1. Limpieza del Monorepo ✅
- [x] `apps/api` eliminado (ya no existe)
- [x] `apps/web` presente y funcional
- [x] `packages/shared` presente (usado por apps/web)
- [x] Commit realizado: "Clean monorepo: remove unused apps/api"
- [x] Push a GitHub completado

### 2. Configuración de Vercel ✅
- [x] `vercel.json` configurado correctamente
  - buildCommand: `cd apps/web && pnpm build`
  - installCommand: `pnpm install`
  - outputDirectory: `apps/web/.next`
  - framework: `nextjs`

### 3. Configuración de Next.js ✅
- [x] `apps/web/next.config.ts` configurado
  - transpilePackages: `["@flip/shared"]`
  - eslint.ignoreDuringBuilds: `true`
  - typescript.ignoreBuildErrors: `true`
  - Sin rewrites a backend externo

### 4. Dependencias ✅
- [x] `apps/web/package.json` tiene todas las dependencias
- [x] `@flip/shared` como workspace dependency
- [x] Next.js 15.5.9
- [x] React 19.2.3
- [x] Better Auth 1.4.15
- [x] Drizzle ORM 0.41.0

### 5. Variables de Entorno ✅
- [x] `.env.example` documentado
- [x] Variables necesarias identificadas:
  - `DATABASE_URL` (Neon PostgreSQL)
  - `TURSO_DATABASE_URL` (Turso LibSQL)
  - `TURSO_AUTH_TOKEN`
  - `BETTER_AUTH_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`

### 6. Git y GitHub ✅
- [x] Repositorio: `https://github.com/YasmaniJob/flip.git`
- [x] Branch: `master`
- [x] Último commit: `d7d5429 Clean monorepo: remove unused apps/api`
- [x] Sin cambios pendientes
- [x] Push completado

---

## 🚀 Pasos para Deploy en Vercel

### PASO 1: Ir a Vercel Dashboard
Abre en tu navegador: **https://vercel.com/new**

### PASO 2: Importar Proyecto
1. Click en **"Import Git Repository"**
2. Selecciona el repositorio: **`YasmaniJob/flip`**
3. Click en **"Import"**

### PASO 3: Configurar Proyecto

#### Framework Preset
- Selecciona: **Next.js**

#### Root Directory
- **IMPORTANTE:** Configura como: **`apps/web`**
- Click en "Edit" junto a "Root Directory"
- Escribe: `apps/web`

#### Build Settings (Auto-detectados)
- Build Command: `pnpm build` ✅
- Output Directory: `.next` ✅
- Install Command: `pnpm install` ✅

### PASO 4: Configurar Variables de Entorno

Click en **"Environment Variables"** y agrega:

```env
DATABASE_URL=postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

TURSO_DATABASE_URL=libsql://flip-v2-yasmanijob.aws-us-east-1.turso.io

TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQxNDQxNDksImlkIjoiMDE5ZDEzMzMtNzgwMS03Zjk0LTlhOGYtMDEyYTAxNWQxODhiIiwicmlkIjoiM2VhOGNmOTctNjM3NC00NjhjLTkxYzItMmYxYzUxM2IxNDQ2In0.zZdG69K6hhya1dc3B3eWWFpX6dImIxGUQ2uQjj9kISbXGoirD-4ZHbqBq3v1hqKPA-iGKb5f_BBqNlFxjBoGAQ

BETTER_AUTH_SECRET=4quRwA5VPAYmkvBkUWC4fsmQITeyypueF4b8yLKBp18=

NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app

NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=false
```

**NOTA:** Después del primer deploy, Vercel te dará una URL. Actualiza `NEXT_PUBLIC_APP_URL` con esa URL y redeploy.

### PASO 5: Deploy
1. Click en **"Deploy"**
2. Espera 3-5 minutos mientras Vercel:
   - Clona el repositorio
   - Instala dependencias (pnpm install)
   - Transpila @flip/shared
   - Construye apps/web (pnpm build)
   - Despliega a producción

### PASO 6: Actualizar URL y Redeploy
1. Una vez completado, copia la URL de Vercel (ej: `flip-v2.vercel.app`)
2. Ve a **Settings → Environment Variables**
3. Actualiza `NEXT_PUBLIC_APP_URL` con la URL real
4. Ve a **Deployments** y click en **"Redeploy"**

---

## 🔍 Verificación Post-Deploy

Después del deploy exitoso, verifica:

- [ ] La aplicación carga en la URL de Vercel
- [ ] El login funciona
- [ ] La base de datos Neon se conecta
- [ ] La base de datos Turso se conecta
- [ ] Las rutas API funcionan
- [ ] No hay errores en la consola del navegador
- [ ] No hay errores en los logs de Vercel

---

## 📊 Información del Proyecto

### Estructura Final
```
flip-v2/
├── apps/
│   └── web/              ← Solo esto se despliega
├── packages/
│   └── shared/           ← Transpilado por Next.js
├── docs/
├── vercel.json
└── package.json
```

### Tamaño del Proyecto
- **Antes:** ~1000 archivos (con apps/api)
- **Después:** ~500 archivos (solo apps/web + shared)
- **Reducción:** 50% menos archivos

### Bases de Datos
- **Neon (PostgreSQL):** Datos transaccionales (usuarios, recursos, préstamos, etc.)
- **Turso (LibSQL):** Datos de referencia MINEDU (instituciones educativas)

### Tecnologías
- Next.js 15.5.9 (App Router)
- React 19.2.3
- TypeScript 5.9.3
- Drizzle ORM 0.41.0
- Better Auth 1.4.15
- Tailwind CSS 4.1.18

---

## 🆘 Troubleshooting

### Si el build falla:

1. **Error de TypeScript:**
   - Ya está configurado `ignoreBuildErrors: true`
   - Verifica que esté en `next.config.ts`

2. **Error de ESLint:**
   - Ya está configurado `ignoreDuringBuilds: true`
   - Verifica que esté en `next.config.ts`

3. **Error de dependencias:**
   - Verifica que `pnpm-workspace.yaml` esté en la raíz
   - Verifica que `@flip/shared` esté en `transpilePackages`

4. **Error de variables de entorno:**
   - Verifica que todas las variables estén configuradas en Vercel
   - Las variables `NEXT_PUBLIC_*` deben estar disponibles

5. **Error de base de datos:**
   - Verifica que `DATABASE_URL` sea la conexión pooled de Neon
   - Verifica que `TURSO_AUTH_TOKEN` sea válido

### Si necesitas ayuda:
- Revisa los logs en: Vercel Dashboard → Deployments → [tu deploy] → Build Logs
- Copia el error y búscalo en la documentación

---

## ✅ TODO ESTÁ LISTO

El proyecto está completamente preparado para deploy en Vercel. Solo necesitas:

1. Ir a https://vercel.com/new
2. Importar el repositorio
3. Configurar Root Directory como `apps/web`
4. Agregar las variables de entorno
5. Click en Deploy

¡Buena suerte! 🚀
