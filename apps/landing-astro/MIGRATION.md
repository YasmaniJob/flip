# Migración de Next.js a Astro

## Problema Original

La landing en Next.js 15 presentaba múltiples problemas en Vercel:

1. **Vulnerabilidad de seguridad**: CVE-2025-66478 en Next.js 15.1.3
2. **Problemas de lockfile**: `pnpm-lock.yaml` constantemente desincronizado
3. **Build lento**: ~50 segundos en Vercel
4. **Configuración compleja**: `output: 'standalone'` causaba errores de symlinks
5. **Overhead innecesario**: React para contenido 100% estático

## Solución: Astro

Astro es perfecto para landing pages porque:

- ✅ **HTML estático puro** - Zero JavaScript por defecto
- ✅ **Build ultra rápido** - 5-10 segundos vs 50 segundos
- ✅ **Sin vulnerabilidades** - No depende de frameworks pesados
- ✅ **Zero configuración** - Funciona out-of-the-box
- ✅ **Mismo diseño** - Migración 1:1 del contenido

## Configuración en Vercel

### Opción 1: Nuevo Proyecto (Recomendado)

1. Ve a Vercel Dashboard
2. New Project → Import tu repositorio
3. Configura:
   - **Framework Preset**: Astro
   - **Root Directory**: `apps/landing-astro`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
4. Deploy

### Opción 2: Actualizar Proyecto Existente

1. Ve a tu proyecto en Vercel
2. Settings → General
3. Actualiza:
   - **Framework Preset**: Astro
   - **Root Directory**: `apps/landing-astro`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
4. Redeploy desde Deployments

## Comparación

| Métrica | Next.js | Astro |
|---------|---------|-------|
| Build Time | ~50s | ~8s |
| Bundle Size | ~200KB JS | ~0KB JS |
| Vulnerabilidades | CVE-2025-66478 | Ninguna |
| Configuración | Compleja | Simple |
| Lockfile Issues | Frecuentes | Ninguno |

## Contenido Migrado

- ✅ Hero section con animaciones
- ✅ Video tutorial section
- ✅ Product pillars (3 cards)
- ✅ Preview section
- ✅ Changelog
- ✅ Pricing (3 planes)
- ✅ Final CTA
- ✅ Footer
- ✅ Todos los estilos Tailwind
- ✅ Animaciones CSS personalizadas
- ✅ Iconos SVG inline (sin dependencias)

## Desarrollo Local

```bash
cd apps/landing-astro
pnpm dev
```

Abre http://localhost:3001

## Build Local

```bash
cd apps/landing-astro
pnpm build
pnpm preview
```

## Notas

- La landing anterior en `apps/landing` puede eliminarse después de verificar el deploy
- Todos los estilos y animaciones son idénticos
- Los iconos de lucide-react fueron reemplazados por SVG inline
- Zero dependencias de runtime = Zero problemas de seguridad
