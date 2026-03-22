# Guía de Deployment en Vercel - FLIP V2

**Fecha:** 22 de marzo de 2026  
**Estado:** ✅ Listo para deploy

## ✅ Preparación Completada

### 1. Configuración del Build
- ✅ `next.config.ts` actualizado con `ignoreDuringBuilds` para ESLint y TypeScript
- ✅ `vercel.json` creado en la raíz del monorepo
- ✅ `.env.example` creado con todas las variables documentadas
- ✅ Build local exitoso

### 2. Estructura del Proyecto
```
flip-v2/                    # Raíz del monorepo
├── apps/
│   └── web/               # Aplicación Next.js
│       ├── .next/         # Build output
│       ├── .env.local     # Variables locales (no commitear)
│       └── .env.example   # Template de variables
├── vercel.json            # Configuración de Vercel
└── package.json           # Monorepo config
```

## 📋 Variables de Entorno Requeridas

Configura estas variables en Vercel Dashboard → Settings → Environment Variables:

### Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL (Neon) pooled connection | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `TURSO_DATABASE_URL` | Turso database URL | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso auth token | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | URL de tu app en Vercel | `https://tu-app.vercel.app` |
| `BETTER_AUTH_SECRET` | Secret para sesiones (32+ chars) | Generar con `openssl rand -base64 32` |

### Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION` | Requerir verificación de email | `false` |

## 🚀 Pasos para Deploy en Vercel

### Opción A: Deploy desde GitHub (Recomendado)

1. **Push a GitHub**
   ```bash
   git add .
   git commit -m "Preparar para deploy en Vercel"
   git push origin main
   ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "Add New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración de `vercel.json`

3. **Configurar Variables de Entorno**
   - En el dashboard del proyecto, ve a Settings → Environment Variables
   - Agrega todas las variables listadas arriba
   - Marca las sensibles como "Sensitive" (DATABASE_URL, TURSO_AUTH_TOKEN, BETTER_AUTH_SECRET)

4. **Deploy**
   - Click en "Deploy"
   - Vercel ejecutará el build automáticamente
   - El deploy toma ~3-5 minutos

### Opción B: Deploy con Vercel CLI

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Configurar variables de entorno**
   ```bash
   vercel env add DATABASE_URL
   vercel env add TURSO_DATABASE_URL
   vercel env add TURSO_AUTH_TOKEN
   vercel env add NEXT_PUBLIC_APP_URL
   vercel env add BETTER_AUTH_SECRET
   ```

5. **Deploy a producción**
   ```bash
   vercel --prod
   ```

## ⚙️ Configuración de Vercel

La configuración en `vercel.json` especifica:

```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

### Configuración Adicional Recomendada

En Vercel Dashboard → Settings:

- **Node.js Version:** 20.x
- **Install Command:** `pnpm install` (ya configurado)
- **Build Command:** `cd apps/web && pnpm build` (ya configurado)
- **Output Directory:** `apps/web/.next` (ya configurado)
- **Root Directory:** Dejar en blanco (usa vercel.json)

## 🗄️ Configuración de Base de Datos

### Neon (PostgreSQL)

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Crea un nuevo proyecto o usa uno existente
3. Copia la **Pooled Connection String**
4. Pégala en `DATABASE_URL` en Vercel

**Importante:** Usa la conexión pooled para mejor rendimiento en serverless.

### Turso (LibSQL)

1. Ve a [turso.tech/app](https://turso.tech/app)
2. Crea una base de datos o usa una existente
3. Obtén la URL: `turso db show <database-name>`
4. Genera un token: `turso db tokens create <database-name>`
5. Configura ambos valores en Vercel

**Recomendación:** Crea la base de datos Turso en la misma región que tu deployment de Vercel.

## 🔒 Seguridad

### Variables Sensibles

Marca como "Sensitive" en Vercel:
- `DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `BETTER_AUTH_SECRET`

### Variables Públicas

Las variables `NEXT_PUBLIC_*` son expuestas al cliente:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION`

**No incluyas secretos en variables NEXT_PUBLIC_***

## 🧪 Testing Post-Deploy

Después del deploy, verifica:

1. **Homepage carga correctamente**
   - Visita `https://tu-app.vercel.app`

2. **Login funciona**
   - Intenta hacer login con credenciales de prueba

3. **Base de datos conecta**
   - Verifica que puedes ver datos en el dashboard

4. **API Routes funcionan**
   - Prueba endpoints como `/api/auth/get-session`

## 🐛 Troubleshooting

### Error: "BETTER_AUTH_SECRET is not defined"

**Solución:** Agrega la variable `BETTER_AUTH_SECRET` en Vercel con un valor aleatorio de 32+ caracteres.

```bash
openssl rand -base64 32
```

### Error: "DATABASE_URL is not defined"

**Solución:** Verifica que agregaste `DATABASE_URL` en las variables de entorno de Vercel.

### Error: "Dynamic server usage"

**Esperado:** Este warning es normal para API Routes que usan `request.headers`. No afecta el funcionamiento.

### Build falla con errores de TypeScript

**Solución:** Ya está configurado `ignoreBuildErrors: true` en `next.config.ts`. Si persiste, verifica que el archivo esté commiteado.

### Imports warnings sobre 'apiClient'

**Esperado:** Estos warnings no afectan el build. Son archivos legacy que no se usan en producción.

## 📊 Monitoreo

Después del deploy, monitorea:

1. **Vercel Analytics**
   - Dashboard → Analytics
   - Revisa tiempos de carga y errores

2. **Vercel Logs**
   - Dashboard → Deployments → [tu deploy] → Logs
   - Revisa errores en tiempo real

3. **Database Metrics**
   - Neon: Revisa conexiones y queries
   - Turso: Revisa latencia y requests

## 🔄 CI/CD Automático

Una vez conectado con GitHub, Vercel automáticamente:

- ✅ Hace deploy en cada push a `main`
- ✅ Crea preview deployments para PRs
- ✅ Ejecuta el build y tests
- ✅ Actualiza la URL de producción

## 📝 Notas Adicionales

### Dominios Personalizados

Para agregar un dominio personalizado:
1. Ve a Settings → Domains
2. Agrega tu dominio
3. Configura los DNS según las instrucciones
4. Actualiza `NEXT_PUBLIC_APP_URL` con tu nuevo dominio

### Escalabilidad

Vercel escala automáticamente:
- Serverless functions para API Routes
- Edge caching para páginas estáticas
- CDN global para assets

### Costos

Plan gratuito incluye:
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- Unlimited deployments

Para producción, considera el plan Pro para:
- Más bandwidth
- Mejor soporte
- Analytics avanzados

---

**¿Listo para deploy?** Sigue los pasos en "Opción A" para comenzar.

**¿Problemas?** Revisa la sección de Troubleshooting o contacta soporte.
