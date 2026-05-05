# 📖 Ejemplos Prácticos de Migración

Este documento muestra ejemplos concretos de cómo migrar diferentes patrones de NestJS a Next.js.

---

## 1️⃣ Ejemplo: Módulo Simple (Grades)

### Antes: NestJS

```typescript
// apps/api/src/infrastructure/http/controllers/grades.controller.ts
@Controller('grades')
@UseGuards(AuthGuard)
export class GradesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>
  ) {}

  @Get()
  async findAll(@CurrentTenant() institutionId: string) {
    return this.db.query.grades.findMany({
      where: eq(schema.grades.institutionId, institutionId),
      orderBy: asc(schema.grades.sortOrder),
    });
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @CurrentTenant() institutionId: string,
    @Body() dto: CreateGradeDto
  ) {
    const [grade] = await this.db
      .insert(schema.grades)
      .values({
        id: randomUUID(),
        institutionId,
        ...dto,
      })
      .returning();
    return grade;
  }
}
```

### Después: Next.js

```typescript
// app/api/grades/route.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { grades } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody } from '@/lib/validations/helpers';
import { createGradeSchema } from '@/lib/validations/schemas/grades';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const results = await db.query.grades.findMany({
      where: eq(grades.institutionId, institutionId),
      orderBy: asc(grades.sortOrder),
    });

    return successResponse(results);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createGradeSchema, body);

    const [grade] = await db
      .insert(grades)
      .values({
        id: randomUUID(),
        institutionId,
        ...data,
      })
      .returning();

    return successResponse(grade, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
```

```typescript
// app/api/grades/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(updateGradeSchema, body);

    const [updated] = await db
      .update(grades)
      .set(data)
      .where(and(eq(grades.id, params.id), eq(grades.institutionId, institutionId)))
      .returning();

    if (!updated) {
      throw new NotFoundError('Grado no encontrado');
    }

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    await db
      .delete(grades)
      .where(and(eq(grades.id, params.id), eq(grades.institutionId, institutionId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
```

---

## 2️⃣ Ejemplo: Módulo con Roles (Categories)

### Antes: NestJS

```typescript
@Controller('categories')
@UseGuards(AuthGuard, RolesGuard)
export class CategoriesController {
  @Post()
  @Roles('admin', 'pip')
  @UsePipes(new ZodValidationPipe(createCategorySchema))
  async create(
    @CurrentTenant() institutionId: string,
    @Body() dto: CreateCategoryDto
  ) {
    const category = await this.createCategory.execute({
      institutionId,
      ...dto,
    });

    // Auto-seed templates
    const defaultTemplates = DEFAULT_TEMPLATES[category.name];
    if (defaultTemplates) {
      for (const temp of defaultTemplates) {
        await this.resourceTemplatesService.create(institutionId, {
          categoryId: category.id,
          ...temp,
        });
      }
    }

    return category;
  }
}
```

### Después: Next.js

```typescript
// app/api/categories/route.ts
import { requireRole, getInstitutionId } from '@/lib/auth/helpers';
import { createCategory } from '@/lib/services/categories/create';
import { autoSeedTemplates } from '@/lib/services/categories/auto-seed';

export async function POST(request: NextRequest) {
  try {
    // Validar rol
    await requireRole(request, ['admin', 'pip']);
    const institutionId = await getInstitutionId(request);

    const body = await request.json();
    const data = validateBody(createCategorySchema, body);

    // Crear categoría
    const category = await createCategory(institutionId, data);

    // Auto-seed templates
    await autoSeedTemplates(institutionId, category);

    return successResponse(category, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
```

```typescript
// lib/services/categories/create.ts
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { generateId } from '@flip/shared';

export async function createCategory(
  institutionId: string,
  data: { name: string; icon?: string; color?: string }
) {
  const [category] = await db
    .insert(categories)
    .values({
      id: generateId(),
      institutionId,
      ...data,
    })
    .returning();

  return category;
}
```

```typescript
// lib/services/categories/auto-seed.ts
import { DEFAULT_TEMPLATES } from '@/lib/constants/default-templates';
import { createResourceTemplate } from '@/lib/services/resource-templates/create';

export async function autoSeedTemplates(
  institutionId: string,
  category: { id: string; name: string }
) {
  const templates = DEFAULT_TEMPLATES[category.name];
  if (!templates) return;

  for (const template of templates) {
    await createResourceTemplate(institutionId, {
      categoryId: category.id,
      ...template,
      isDefault: true,
    });
  }
}
```

---

## 3️⃣ Ejemplo: Lógica Compleja (Onboarding)

### Antes: NestJS

```typescript
@Injectable()
export class InstitutionsService {
  async onboardUser(userId: string, data: OnboardData) {
    // 1. Buscar institución
    let institution = await this.db.query.institutions.findFirst({
      where: eq(schema.institutions.codigoModular, data.codigoModular),
    });

    // 2. Crear si no existe
    if (!institution) {
      const [newInst] = await this.db
        .insert(schema.institutions)
        .values({
          id: crypto.randomUUID(),
          codigoModular: data.codigoModular,
          name: data.nombre,
          // ...
        })
        .returning();

      institution = newInst;

      // Auto-seed categorías
      for (const cat of DEFAULT_CATEGORIES) {
        await this.createCategoryCommand.execute({
          institutionId: institution.id,
          ...cat,
        });
      }
    }

    // 3. Asignar usuario
    const isFirstUser = await this.isFirstUserInInstitution(institution.id);
    const role = isFirstUser ? 'superadmin' : 'admin';

    await this.db
      .update(schema.users)
      .set({ institutionId: institution.id, role })
      .where(eq(schema.users.id, userId));

    return institution;
  }
}
```

### Después: Next.js

```typescript
// app/api/institutions/onboard/route.ts
import { requireAuth } from '@/lib/auth/helpers';
import { onboardUser } from '@/lib/services/institutions/onboard';

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const body = await request.json();
    const data = validateBody(onboardSchema, body);

    const institution = await onboardUser(user.id, data);

    return successResponse(institution, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
```

```typescript
// lib/services/institutions/onboard.ts
import { db } from '@/lib/db';
import { institutions, users } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { autoSeedCategories } from './auto-seed-categories';

export async function onboardUser(
  userId: string,
  data: {
    codigoModular: string;
    nivel: string;
    nombre?: string;
    isManual?: boolean;
  }
) {
  return await db.transaction(async (tx) => {
    // 1. Buscar institución
    let institution = await tx.query.institutions.findFirst({
      where: eq(institutions.codigoModular, data.codigoModular),
    });

    // 2. Crear si no existe
    if (!institution) {
      const [newInst] = await tx
        .insert(institutions)
        .values({
          id: randomUUID(),
          codigoModular: data.codigoModular,
          name: data.nombre || 'Institución sin nombre',
          nivel: data.nivel,
          slug: generateSlug(data.nombre || 'institucion'),
          subscriptionStatus: 'trial',
          trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        })
        .returning();

      institution = newInst;

      // Auto-seed categorías y templates
      await autoSeedCategories(tx, institution.id);
    }

    // 3. Verificar si es primer usuario
    const [{ value: userCount }] = await tx
      .select({ value: count() })
      .from(users)
      .where(eq(users.institutionId, institution.id));

    const isFirstUser = userCount === 0;
    const role = isFirstUser ? 'superadmin' : 'admin';

    // 4. Asignar usuario
    await tx
      .update(users)
      .set({ institutionId: institution.id, role })
      .where(eq(users.id, userId));

    return institution;
  });
}
```

---

## 4️⃣ Ejemplo: Query Compleja (Dashboard Stats)

### Antes: NestJS

```typescript
@Injectable()
export class DashboardService {
  async getInstitutionStats(institutionId: string) {
    const [
      totalStaff,
      totalResources,
      availableResources,
      activeLoans,
      overdueLoans,
    ] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(schema.staff)
        .where(
          and(
            eq(schema.staff.institutionId, institutionId),
            eq(schema.staff.status, 'active')
          )
        ),
      this.db
        .select({ count: count() })
        .from(schema.resources)
        .where(eq(schema.resources.institutionId, institutionId)),
      // ...
    ]);

    return {
      institution: {
        totalStaff: totalStaff[0].count,
        totalResources: totalResources[0].count,
        // ...
      },
    };
  }
}
```

### Después: Next.js

```typescript
// app/api/dashboard/stats/route.ts
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { getInstitutionStats } from '@/lib/services/dashboard/stats';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const stats = await getInstitutionStats(institutionId);

    return successResponse(stats);
  } catch (error) {
    return errorResponse(error);
  }
}
```

```typescript
// lib/services/dashboard/stats.ts
import { db } from '@/lib/db';
import { staff, resources, loans } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function getInstitutionStats(institutionId: string) {
  const [
    totalStaff,
    totalResources,
    availableResources,
    activeLoans,
    overdueLoans,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(staff)
      .where(and(eq(staff.institutionId, institutionId), eq(staff.status, 'active'))),
    db
      .select({ count: count() })
      .from(resources)
      .where(eq(resources.institutionId, institutionId)),
    db
      .select({ count: count() })
      .from(resources)
      .where(
        and(
          eq(resources.institutionId, institutionId),
          eq(resources.status, 'disponible')
        )
      ),
    db
      .select({ count: count() })
      .from(loans)
      .where(and(eq(loans.institutionId, institutionId), eq(loans.status, 'active'))),
    db
      .select({ count: count() })
      .from(loans)
      .where(and(eq(loans.institutionId, institutionId), eq(loans.status, 'overdue'))),
  ]);

  return {
    institution: {
      totalStaff: Number(totalStaff[0].count),
      totalResources: Number(totalResources[0].count),
      availableResources: Number(availableResources[0].count),
      activeLoans: Number(activeLoans[0].count),
      overdueLoans: Number(overdueLoans[0].count),
    },
  };
}
```

---

## 5️⃣ Ejemplo: Paginación

### Antes: NestJS

```typescript
async findAll(institutionId: string, pagination: PaginationDto) {
  const { limit = 10, page = 1 } = pagination;
  const offset = (page - 1) * limit;

  const [results, totalResult] = await Promise.all([
    this.db
      .select()
      .from(schema.staff)
      .where(eq(schema.staff.institutionId, institutionId))
      .limit(limit)
      .offset(offset),
    this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.staff)
      .where(eq(schema.staff.institutionId, institutionId)),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    data: results,
    meta: {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    },
  };
}
```

### Después: Next.js

```typescript
// app/api/staff/route.ts
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const institutionId = await getInstitutionId(request);

    const query = validateQuery(
      paginationSchema,
      request.nextUrl.searchParams
    );

    const result = await findAllStaff(institutionId, query);

    return paginatedResponse(result.data, result.meta);
  } catch (error) {
    return errorResponse(error);
  }
}
```

```typescript
// lib/services/staff/find-all.ts
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function findAllStaff(
  institutionId: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number }
) {
  const offset = (page - 1) * limit;

  const [results, totalResult] = await Promise.all([
    db
      .select()
      .from(staff)
      .where(eq(staff.institutionId, institutionId))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(staff)
      .where(eq(staff.institutionId, institutionId)),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return {
    data: results,
    meta: {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    },
  };
}
```

---

## 🎓 Lecciones Aprendidas

1. **Mantener la misma estructura de respuesta** para compatibilidad con frontend
2. **Usar transacciones** para operaciones complejas
3. **Extraer lógica de negocio** a funciones puras reutilizables
4. **Validar siempre** autenticación, roles e institutionId
5. **Manejar errores** de forma consistente
6. **Documentar** cambios significativos