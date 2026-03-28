# Despliegue de Landing en Vercel - Guía Completa

## 🚀 Configuración Rápida

### Paso 1: Crear Proyecto en Vercel

1. Ve a https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Selecciona tu repositorio: `YasmaniJob/flip`
4. Click **"Import"**

### Paso 2: Configuración del Proyecto

**⚠️ IMPORTANTE - Configuración Correcta:**

```
Framework Preset: Next.js
Root Directory: apps/landing
Build Command: (dejar el default o usar el de vercel.json)
Output Directory: .next
Install Command: pnpm install
Node Version: 20.x
```

### Paso 3: Variables de Entorno (Opcional)

```env
NEXT_PUBLIC_APP_URL=https://app.flip.org.pe
```

### Paso 4: Deploy

Click en **"Deploy"** y espera 2-3 minutos.

---

## 🔧 Configuración Detallada

### vercel.json Explicado

```json
{
  "buildCommand": "cd ../.. && pnpm install --frozen-lockfile && cd apps/landing && pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

**¿Qué hace cada comando?**
- `cd ../..` - Va a la raíz del monorepo
- `pnpm install --frozen-lockfile` - Instala dependencias (sin modificar lock)
- `cd apps/landing` - Entra al directorio de landing
- `pnpm build` - Ejecuta el build de Next.js

### Estructura del Proyecto

```
flip-v2/
├── apps/
│   ├── web/          # Dashboard (app.flip.org.pe)
│   └── landing/      # Landing (flip.org.pe)
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── package.json
```

---

## ⚠️ Problemas Comunes y Soluciones

### 1. Error: "No Build Output"

**Problema:** Vercel no encuentra el output del build.

**Solución:**
- Verifica que Root Directory sea `apps/landing`
- Asegúrate de que Output Directory sea `.next`
- Revisa que el build funcione localmente: `cd apps/landing && pnpm build`

### 2. Error: "Module not found"

**Problema:** Dependencias no se instalan correctamente.

**Solución:**
- Verifica que `pnpm-workspace.yaml` esté en la raíz
- Asegúrate de que `pnpm-lock.yaml` esté commiteado
- Usa `--frozen-lockfile` en el install command

### 3. Error: "Build Command Failed"

**Problema:** El build command no se ejecuta correctamente.

**Solución:**
```bash
# Prueba localmente desde la raíz:
cd flip-v2
pnpm install --frozen-lockfile
cd apps/landing
pnpm build
```

### 4. Error: "TypeScript/ESLint Errors"

**Problema:** Errores de tipo o lint bloquean el build.

**Solución:** Ya está configurado en `next.config.js`:
```js
typescript: {
  ignoreBuildErrors: true,
},
eslint: {
  ignoreDuringBuilds: true,
}
```

---

## 📋 Checklist Pre-Deploy

Antes de hacer deploy, verifica:

- [ ] `apps/landing/package.json` existe y tiene script `build`
- [ ] `apps/landing/vercel.json` existe
- [ ] `pnpm-workspace.yaml` está en la raíz del repo
- [ ] `pnpm-lock.yaml` está commiteado
- [ ] El build funciona localmente: `cd apps/landing && pnpm build`
- [ ] Root Directory en Vercel es `apps/landing`
- [ ] Node version es 20.x

---

## 🎯 Configuración de Dominios

### Dominio Principal: flip.org.pe

1. Ve a **Settings** → **Domains** en Vercel
2. Agrega `flip.org.pe`
3. Configura DNS en tu proveedor:

```
Type: A
Name: @
Value: 76.76.21.21 (IP de Vercel)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Subdominios

- `app.flip.org.pe` → Proyecto `flip-web` (Dashboard)
- `flip.org.pe` → Proyecto `flip-landing` (Landing)

---

## 🔄 Workflow de Desarrollo

### Desarrollo Local

```bash
# Desde la raíz del proyecto
cd apps/landing
pnpm dev
```

### Build Local

```bash
cd apps/landing
pnpm build
pnpm start
```

### Deploy a Vercel

```bash
git add .
git commit -m "Update landing"
git push origin master
```

Vercel detecta el push y hace deploy automáticamente.

---

## 🐛 Debugging

### Ver Logs de Build

1. Ve a tu proyecto en Vercel Dashboard
2. Click en el deployment fallido
3. Ve a **"Build Logs"**
4. Busca el error específico

### Errores Comunes en Logs

**"pnpm: command not found"**
- Vercel debe detectar pnpm automáticamente
- Si no, agrega `"packageManager": "pnpm@9.0.0"` en package.json

**"Cannot find module"**
- Verifica que todas las dependencias estén en package.json
- Ejecuta `pnpm install` localmente y commitea el lock file

**"Build exceeded maximum duration"**
- El build tarda más de 45 minutos (límite de Vercel Free)
- Optimiza el build o upgrade a plan Pro

---

## ✅ Verificación Post-Deploy

Después del deploy exitoso:

1. [ ] El sitio carga en la URL de Vercel (*.vercel.app)
2. [ ] No hay errores en la consola del navegador
3. [ ] Todas las páginas funcionan correctamente
4. [ ] Las imágenes y assets cargan
5. [ ] El dominio custom está configurado (si aplica)

---

## 📞 Soporte

Si sigues teniendo problemas:

1. **Revisa los logs de build** en Vercel Dashboard
2. **Prueba el build localmente** con los mismos comandos
3. **Compara con apps/web** que ya está funcionando
4. **Verifica la configuración** de Root Directory

### Comandos de Diagnóstico

```bash
# Verificar estructura del monorepo
ls -la apps/

# Verificar pnpm workspace
cat pnpm-workspace.yaml

# Probar build completo
cd apps/landing
pnpm install
pnpm build

# Ver output del build
ls -la .next/
```

---

## 🎉 Deploy Exitoso

Una vez que el deploy funcione:

- ✅ Landing page disponible en Vercel URL
- ✅ Builds automáticos en cada push
- ✅ Preview deployments en cada PR
- ✅ Dominio custom configurado (opcional)

**URL de ejemplo:** https://flip-landing.vercel.app
