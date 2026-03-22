# 🔧 Fix: Vercel Build Error - Root Directory

**Fecha:** 22 de Marzo, 2026  
**Error:** `cd: apps/web: No such file or directory`  
**Estado:** ✅ CORREGIDO

---

## ❌ Problema Detectado

### Error en el Build
```
10:58:01.016 Running "cd apps/web && pnpm build"
10:58:01.020 sh: line 1: cd: apps/web: No such file or directory
10:58:01.026 Error: Command "cd apps/web && pnpm build" exited with 1
```

### Causa Raíz
El `vercel.json` tenía configurado:
```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/.next"
}
```

**Problema:** Cuando configuras **Root Directory** en Vercel Dashboard como `apps/web`, Vercel ya ejecuta los comandos DENTRO de ese directorio. Intentar hacer `cd apps/web` desde dentro de `apps/web` falla.

---

## ✅ Solución Aplicada

### Cambio en vercel.json

**ANTES (incorrecto):**
```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

**DESPUÉS (correcto):**
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Cambios Realizados
1. ✅ Eliminado `cd apps/web &&` del buildCommand
2. ✅ Cambiado `apps/web/.next` a `.next` (ruta relativa)
3. ✅ Eliminado `installCommand` (Vercel lo detecta automáticamente)
4. ✅ Commit y push realizados

### Commit
```
c59f6c6 fix: Update vercel.json for Root Directory configuration
```

---

## 🔄 Próximos Pasos

### En Vercel Dashboard

1. **Ve a tu proyecto en Vercel**
2. **Settings → General → Build & Development Settings**
3. **Verifica que Root Directory esté configurado como:** `apps/web`
4. **Redeploy el proyecto:**
   - Ve a Deployments
   - Click en los 3 puntos del último deploy
   - Click en "Redeploy"

### Configuración Correcta en Vercel

```
Root Directory: apps/web
Framework Preset: Next.js
Build Command: (auto-detected from vercel.json)
Output Directory: (auto-detected from vercel.json)
Install Command: pnpm install (auto-detected)
```

---

## 📝 Explicación Técnica

### Cómo Funciona Root Directory

Cuando configuras Root Directory en Vercel:

1. Vercel clona el repositorio completo
2. Cambia al directorio especificado (apps/web)
3. Ejecuta los comandos DESDE ese directorio

**Por lo tanto:**
- ✅ Correcto: `pnpm build` (ya estás en apps/web)
- ❌ Incorrecto: `cd apps/web && pnpm build` (intenta ir a apps/web/apps/web)

### Rutas Relativas

Con Root Directory = `apps/web`:
- Build output: `.next` (no `apps/web/.next`)
- Package.json: `./package.json` (no `apps/web/package.json`)
- Todos los paths son relativos a `apps/web`

---

## ✅ Verificación

Después del redeploy, deberías ver:

```
✓ Cloning completed
✓ Running "pnpm install"
✓ Dependencies installed
✓ Running "pnpm build"
✓ Build completed
✓ Deployment ready
```

---

## 🎯 Estado Actual

- ✅ vercel.json corregido
- ✅ Commit realizado: c59f6c6
- ✅ Push a GitHub completado
- ⏳ Esperando redeploy en Vercel

---

## 📚 Referencias

- Vercel Monorepo Docs: https://vercel.com/docs/monorepos
- Root Directory: https://vercel.com/docs/projects/project-configuration#root-directory

---

**Siguiente acción:** Redeploy en Vercel Dashboard
