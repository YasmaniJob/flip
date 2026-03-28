# Flip Landing - Astro

Landing page de Flip construida con Astro para máxima velocidad y simplicidad.

## Características

- ⚡ Astro 5 - Ultra rápido, HTML estático
- 🎨 Tailwind CSS - Estilos utilitarios
- 📦 Zero JavaScript por defecto - Solo HTML/CSS
- 🗄️ Turso Database - Changelog dinámico desde BD
- 🚀 Deploy en Vercel - Sin complicaciones

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Agregar TURSO_DATABASE_URL y TURSO_AUTH_TOKEN

# Desarrollo local
pnpm dev

# Build para producción
pnpm build

# Preview del build
pnpm preview
```

## Base de Datos

El changelog se lee dinámicamente desde Turso (misma BD que la app principal).

### Migrar tabla de changelog

Ejecuta la migración en la app principal:

```bash
cd apps/web
pnpm db:push
```

La migración está en: `apps/web/drizzle/20260328120000_create_changelog_table.sql`

### Seed inicial (opcional)

Si necesitas poblar el changelog manualmente:

```bash
cd apps/landing-astro
tsx scripts/seed-changelog.ts
```

## Deploy en Vercel

1. Conecta el repositorio en Vercel
2. Configura el proyecto:
   - Framework Preset: Astro
   - Root Directory: `apps/landing-astro`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
3. Agrega variables de entorno:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy automático en cada push

## Ventajas sobre Next.js

- Sin problemas de lockfile
- Sin vulnerabilidades de seguridad
- Build más rápido (5-10s vs 50s)
- Menor tamaño de bundle
- HTML estático puro
- Zero configuración
- Changelog dinámico desde BD
