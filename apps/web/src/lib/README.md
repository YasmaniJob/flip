# 📚 Infraestructura Base - Next.js Backend

Esta carpeta contiene la infraestructura base para el backend de Next.js que reemplazará a NestJS.

## 📁 Estructura

```
lib/
├── auth/                    # Autenticación con Better Auth
│   ├── index.ts            # Configuración de Better Auth
│   └── helpers.ts          # requireAuth, requireRole, getInstitutionId, requireSuperAdmin
├── db/                      # Base de datos con Drizzle ORM
│   ├── index.ts            # Cliente Drizzle
│   └── schema.ts           # Schema completo de la base de datos
├── validations/             # Validaciones con Zod
│   ├── helpers.ts          # validateBody, validateQuery
│   └── schemas/
│       └── common.ts       # paginationSchema, idParamSchema
├── utils/                   # Utilidades
│   ├── errors.ts           # Clases de error personalizadas
│   └── response.ts         # Helpers de respuesta HTTP
├── services/                # Lógica de negocio (vacío - se llenará durante migración)
└── repositories/            # Capa de acceso a datos (vacío - se llenará durante migración)
```

## 🔐 Autenticación

### Helpers disponibles

```typescript
import { requireAuth, requireRole, getInstitutionId, requireSuperAdmin } from '@/lib/auth/helpers';

// Requiere autenticación
const { user, session } = await requireAuth(request);

// Requiere roles específicos
const user = await requireRole(request, ['admin', 'pip']);

// Obtiene institutionId (multi-tenancy)
const institutionId = await getInstitutionId(request);

// Requiere SuperAdmin
const user = await requireSuperAdmin(request);
```

## ✅ Validaciones

### Helpers disponibles

```typescript
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { paginationSchema } from '@/lib/validations/schemas/common';

// Validar body
const data = validateBody(mySchema, await request.json());

// Validar query params
const query = validateQuery(paginationSchema, request.nextUrl.searchParams);
```

## 🚨 Manejo de Errores

### Clases de error disponibles

```typescript
import { 
  AppError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ValidationError 
} from '@/lib/utils/errors';

// Lanzar errores
throw new UnauthorizedError('No autenticado');
throw new ForbiddenError('Sin permisos');
throw new NotFoundError('Recurso no encontrado');
throw new ValidationError('Datos inválidos', errors);
```

## 📤 Respuestas HTTP

### Helpers disponibles

```typescript
import { successResponse, errorResponse, paginatedResponse } from '@/lib/utils/response';

// Respuesta exitosa
return successResponse(data);
return successResponse(data, 201);

// Respuesta de error
return errorResponse(error);

// Respuesta paginada
return paginatedResponse(items, {
  total: 100,
  page: 1,
  limit: 10,
  lastPage: 10,
});
```

## 🗄️ Base de Datos

### Cliente Drizzle

```typescript
import { db } from '@/lib/db';
import { users, institutions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Queries
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// Inserts
const [newUser] = await db.insert(users).values(data).returning();

// Updates
await db.update(users).set(data).where(eq(users.id, userId));

// Deletes
await db.delete(users).where(eq(users.id, userId));
```

## 📝 Próximos Pasos

1. ✅ Infraestructura base creada
2. ⏳ Migrar módulos simples (Grades, Sections, etc.)
3. ⏳ Migrar módulos intermedios (Users, Categories, etc.)
4. ⏳ Migrar módulos complejos (Resources, Loans, etc.)
5. ⏳ Migrar módulo crítico (Institutions)

Ver [ORDEN_MIGRACION.md](../../../../docs/ORDEN_MIGRACION.md) para el plan completo.
