# Flip v2

Sistema de gestión de inventario y préstamos para instituciones educativas.

## 🏗️ Estructura

```
flip-v2/
├── apps/
│   ├── web/       # Next.js 15 (Frontend)
│   └── api/       # NestJS 10 (Backend)
├── packages/
│   └── shared/    # Tipos, validadores, utils compartidos
├── turbo.json     # Turborepo config
└── pnpm-workspace.yaml
```

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20+
- pnpm 9+
- PostgreSQL

### Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp apps/api/.env.example apps/api/.env.local

# Configurar DATABASE_URL en apps/api/.env.local

# Ejecutar migraciones
pnpm --filter @flip/api db:generate
pnpm --filter @flip/api db:migrate

# Iniciar desarrollo
pnpm dev
```

## 📦 Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia todos los apps en modo desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm typecheck` | Verificar tipos TypeScript |
| `pnpm test` | Ejecutar tests |

## 🌐 URLs

| App | URL |
|-----|-----|
| Frontend (Web) | http://localhost:3000 |
| Backend (API) | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/api/docs |

## 📚 Stack Tecnológico

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, TanStack Query
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Shared**: TypeScript, Zod, date-fns
- **Auth**: Better Auth (por implementar)
- **Email**: Brevo (por implementar)
