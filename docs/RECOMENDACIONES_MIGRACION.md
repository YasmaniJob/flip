# 💡 Recomendaciones y Mejores Prácticas

## 🏗️ Estructura de Carpetas Propuesta

```
apps/web/src/
├── app/
│   ├── api/                          # API Route Handlers
│   │   ├── auth/                     # Better Auth endpoints
│   │   ├── users/
│   │   │   ├── route.ts              # GET /api/users, POST /api/users
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET/PUT/DELETE /api/users/:id
│   │   ├── institutions/
│   │   │   ├── search/route.ts
│   │   │   ├── onboard/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── brand/route.ts
│   │   ├── resources/
│   │   │   ├── route.ts
│   │   │   ├── batch/route.ts
│   │   │   ├── stats/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── last-damage-report/route.ts
│   │   ├── categories/
│   │   ├── loans/
│   │   ├── reservations/
│   │   ├── meetings/
│   │   ├── staff/
│   │   ├── grades/
│   │   ├── sections/
│   │   ├── curricular-areas/
│   │   ├── pedagogical-hours/
│   │   └── classrooms/
│   └── (dashboard)/                  # Frontend routes
├── lib/
│   ├── auth/
│   │   ├── index.ts                  # Better Auth config
│   │   ├── helpers.ts                # requireAuth, requireRole, etc.
│   │   └── types.ts                  # Session, User types
│   ├── db/
│   │   ├── index.ts                  # Drizzle client (ya existe)
│   │   └── schema.ts                 # Schema (ya existe)
│   ├── validations/
│   │   ├── helpers.ts                # validateBody, validateQuery
│   │   └── schemas/                  # Esquemas Zod por módulo
│   │       ├── users.ts
│   │       ├── resources.ts
│   │       ├── loans.ts
│   │       └── ...
│   ├── services/                     # Lógica de negocio
│   │   ├── users.ts
│   │   ├── institutions.ts
│   │   ├── dashboard.ts
│   │   ├── resources/
│   │   │   ├── create.ts
│   │   │   ├── update.ts
│   │   │   ├── batch.ts
│   │   │   └── stats.ts
│   │   ├── loans/
│   │   ├── reservations/
│   │   └── ...
│   ├── repositories/                 # Acceso a datos (opcional)
│   │   ├── resources.ts
│   │   ├── loans.ts
│   │   └── ...
│   └── utils/
│       ├── errors.ts                 # Custom errors
│       ├── response.ts               # Response helpers
│       └── pagination.ts             # Pagination helpers
└── packages/shared/src/
    └── schemas/                      # Esquemas compartidos
        ├── users.ts
        ├── resources.ts
        └── ...
```

---

## 🔧 Helpers Esenciales

### 1. Autenticación y Autorización

```typescript
// lib/auth/helpers.ts
import { auth } from './index';
import { NextRequest } from 'next/server';

export async function requireAuth(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new UnauthorizedError('No autenticado');
  }

  return { user: session.user, session };
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const { user } = await requireAuth(request);

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError('No tienes permisos para esta acción');
  }

  return user;
}

export async function getInstitutionId(request: NextRequest) {
  const { user } = await requireAuth(request);

  if (!user.institutionId) {
    throw new UnauthorizedError('Debes tener una institución asignada');
  }

  return user.institutionId;
}

export async function requireSuperAdmin(request: NextRequest) {
  const { user } = await requireAuth(request);

  if (!user.isSuperAdmin) {
    throw new ForbiddenError('Solo SuperAdmin puede realizar esta acción');
  }

  return user;
}
```

### 2. Validación con Zod

```typescript
// lib/validations/helpers.ts
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/utils/errors';

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Datos inválidos', error.errors);
    }
    throw error;
  }
}

export function validateQuery<T>(
  schema: ZodSchema<T>,
  params: URLSearchParams
): T {
  const obj = Object.fromEntries(params.entries());
  return validateBody(schema, obj);
}
```

### 3. Manejo de Errores

```typescript
// lib/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permisos') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', public errors?: any[]) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
```

### 4. Response Helpers

```typescript
// lib/utils/response.ts
import { NextResponse } from 'next/server';
import { AppError } from './errors';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { errors: error.errors }),
      },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  );
}

export function paginatedResponse<T>(
  data: T[],
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  }
) {
  return successResponse({ data, meta });
}
```

---

## 📝 Patrón de Route Handler

### Ejemplo: GET /api/resources

```typescript
// app/api/resources/route.ts
import { NextRequest } from 'next/server';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateQuery } from '@/lib/validations/helpers';
import { findResourcesSchema } from '@/lib/validations/schemas/resources';
import { findResources } from '@/lib/services/resources/find';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticación
    await requireAuth(request);

    // 2. Multi-tenancy
    const institutionId = await getInstitutionId(request);

    // 3. Validación de query params
    const query = validateQuery(
      findResourcesSchema,
      request.nextUrl.searchParams
    );

    // 4. Lógica de negocio
    const resources = await findResources(institutionId, query);

    // 5. Response
    return successResponse(resources);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Ejemplo: POST /api/resources

```typescript
// app/api/resources/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación y autorización
    await requireRole(request, ['admin', 'pip']);

    // 2. Multi-tenancy
    const institutionId = await getInstitutionId(request);

    // 3. Validación de body
    const body = await request.json();
    const data = validateBody(createResourceSchema, body);

    // 4. Lógica de negocio
    const resource = await createResource(institutionId, data);

    // 5. Response
    return successResponse(resource, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
```

---

## 🎨 Esquemas Zod Reutilizables

```typescript
// lib/validations/schemas/common.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

// lib/validations/schemas/resources.ts
export const createResourceSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional(),
  templateId: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(['bueno', 'regular', 'malo']).default('bueno'),
  notes: z.string().optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export const findResourcesSchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  condition: z.string().optional(),
});
```

---

## 🔄 Migración de CQRS a Funciones Puras

### Antes (NestJS)

```typescript
// application/use-cases/resources/commands/create-resource.command.ts
@Injectable()
export class CreateResourceCommand {
  constructor(
    @Inject('IResourceRepository')
    private readonly repo: IResourceRepository
  ) {}

  async execute(input: CreateResourceInput): Promise<Resource> {
    const resource = Resource.create(/* ... */);
    return this.repo.save(resource);
  }
}
```

### Después (Next.js)

```typescript
// lib/services/resources/create.ts
import { db } from '@/lib/db';
import { resources } from '@/lib/db/schema';
import { generateId } from '@flip/shared';

export async function createResource(
  institutionId: string,
  data: CreateResourceInput
) {
  const resource = {
    id: generateId(),
    institutionId,
    ...data,
    status: 'disponible',
    createdAt: new Date(),
  };

  const [created] = await db.insert(resources).values(resource).returning();
  return created;
}
```

---

## 🧪 Testing

### Unit Tests (Vitest)

```typescript
// lib/services/resources/create.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createResource } from './create';

describe('createResource', () => {
  it('should create a resource with correct data', async () => {
    const result = await createResource('inst-1', {
      name: 'Laptop HP',
      categoryId: 'cat-1',
    });

    expect(result).toMatchObject({
      name: 'Laptop HP',
      institutionId: 'inst-1',
      status: 'disponible',
    });
  });
});
```

### Integration Tests (Playwright o Vitest con DB)

```typescript
// tests/api/resources.test.ts
import { test, expect } from '@playwright/test';

test('POST /api/resources creates a resource', async ({ request }) => {
  const response = await request.post('/api/resources', {
    data: {
      name: 'Laptop HP',
      categoryId: 'cat-1',
    },
    headers: {
      Authorization: 'Bearer <token>',
    },
  });

  expect(response.status()).toBe(201);
  const data = await response.json();
  expect(data.name).toBe('Laptop HP');
});
```

---

## 📚 Recursos Adicionales

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zod Validation](https://zod.dev/)

---

## ⚠️ Consideraciones Importantes

1. **No eliminar NestJS hasta completar migración completa**
2. **Probar cada endpoint antes de continuar**
3. **Mantener misma estructura de respuestas para compatibilidad con frontend**
4. **Usar transacciones Drizzle para operaciones complejas**
5. **Documentar cambios en API si hay diferencias**
6. **Considerar rate limiting y CORS en producción**
7. **Implementar logging adecuado (Winston, Pino)**
8. **Configurar variables de entorno correctamente**