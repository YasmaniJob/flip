# Flip Landing - Astro

Landing page de Flip construida con Astro para máxima velocidad y simplicidad.

## Características

- ⚡ Astro 5 - Ultra rápido, HTML estático
- 🎨 Tailwind CSS - Estilos utilitarios
- 📦 Zero JavaScript por defecto - Solo HTML/CSS
- 🚀 Deploy en Vercel - Sin complicaciones

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm dev

# Build para producción
pnpm build

# Preview del build
pnpm preview
```

## Deploy en Vercel

1. Conecta el repositorio en Vercel
2. Configura el proyecto:
   - Framework Preset: Astro
   - Root Directory: `apps/landing-astro`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
3. Deploy automático en cada push

## Ventajas sobre Next.js

- Sin problemas de lockfile
- Sin vulnerabilidades de seguridad
- Build más rápido (5-10s vs 50s)
- Menor tamaño de bundle
- HTML estático puro
- Zero configuración
