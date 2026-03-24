# Despliegue de Landing en Vercel

## ✅ Verificación Pre-Deploy

### 1. Package.json
- ✅ Script `build`: `next build` (válido para Next.js)
- ✅ Script `start`: `next start`
- ✅ Dependencias correctas (Next.js 15, React 19)

### 2. Next.config.js
- ✅ Sin rutas que conflictúen con el monorepo
- ✅ `transpilePackages: []` (no comparte paquetes con apps/web)

### 3. Workspace Configuration
- ✅ `pnpm-workspace.yaml` incluye `apps/*`
- ✅ Proyecto aislado sin dependencias de otros workspaces

### 4. Archivos de Configuración
- ✅ `vercel.json` - Configuración de build para monorepo
- ✅ `.vercelignore` - Ignora archivos fuera del workspace
- ✅ `.env.example` - Template de variables de entorno

---

## 📋 Pasos para Desplegar en Vercel

### 1. Crear Nuevo Proyecto en Vercel

1. Ve a https://vercel.com/dashboard
2. Click en **"Add New..."** → **"Project"**
3. Selecciona el mismo repositorio: `YasmaniJob/flip`

### 2. Configurar el Proyecto

**General Settings:**
- **Project Name:** `flip-landing` (o el que prefieras)
- **Framework Preset:** Next.js
- **Root Directory:** `apps/landing` ⚠️ IMPORTANTE

**Build & Development Settings:**
- **Build Command:** (dejar vacío, usa el de vercel.json)
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`

### 3. Variables de Entorno

Agrega en Vercel → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://flip.org.pe
```

### 4. Configurar Dominio

1. Ve a **Settings** → **Domains**
2. Agrega el dominio: `flip.org.pe`
3. Configura los DNS en tu proveedor:
   - Type: `A` → Name: `@` → Value: (IP de Vercel)
   - Type: `CNAME` → Name: `www` → Value: `cname.vercel-dns.com`

### 5. Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (~2-3 minutos)
3. Verifica que el sitio esté funcionando

---

## 🔧 Configuración del Monorepo

### Build Command Explicado

El `vercel.json` usa este comando:
```bash
cd ../.. && pnpm install && pnpm --filter=landing build
```

**¿Por qué?**
- `cd ../..` - Va a la raíz del monorepo
- `pnpm install` - Instala todas las dependencias del workspace
- `pnpm --filter=landing` - Ejecuta el build solo para el proyecto landing

### Estructura del Monorepo

```
flip-v2/
├── apps/
│   ├── web/          # Dashboard (app.flip.org.pe)
│   └── landing/      # Landing (flip.org.pe) ← NUEVO
├── packages/         # Paquetes compartidos (si los hay)
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

---

## ⚠️ Notas Importantes

### 1. Builds Independientes
- `apps/web` y `apps/landing` se despliegan por separado
- Cada uno tiene su propio proyecto en Vercel
- No comparten código ni dependencias

### 2. Dominios
- `app.flip.org.pe` → apps/web (Dashboard)
- `flip.org.pe` → apps/landing (Landing page)

### 3. Git Workflow
- Ambos proyectos usan el mismo repositorio
- Vercel detecta cambios automáticamente
- Puedes configurar `ignoreCommand` para builds selectivos

### 4. Monorepo con pnpm
- Vercel soporta pnpm workspaces nativamente
- El `vercel.json` maneja el build correctamente
- No necesitas Turborepo para este caso simple

---

## 🐛 Troubleshooting

### Error: "Module not found"
- Verifica que `pnpm-workspace.yaml` esté en la raíz
- Asegúrate de que Root Directory sea `apps/landing`

### Error: "Build failed"
- Revisa los logs en Vercel Dashboard
- Verifica que el build funcione localmente: `pnpm build`

### Error: "Domain not configured"
- Espera 24-48h para propagación DNS
- Verifica los registros DNS en tu proveedor

---

## ✅ Checklist Final

Antes de hacer el deploy, verifica:

- [ ] `apps/landing/package.json` tiene script `build`
- [ ] `apps/landing/vercel.json` existe
- [ ] Root Directory en Vercel es `apps/landing`
- [ ] Variables de entorno configuradas
- [ ] Dominio `flip.org.pe` agregado en Vercel
- [ ] DNS configurados en el proveedor

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de build en Vercel
2. Verifica que el build funcione localmente
3. Compara con la configuración de `apps/web`
