# ✅ Fase 3: Módulos Intermedios - COMPLETADA

**Fecha:** 21 de marzo de 2026  
**Estado:** ✅ Completado

---

## 📦 Módulos Migrados (5/5)

### ✅ 1. Users (Usuarios)
**Archivos creados:**
- `lib/validations/schemas/users.ts`
- `app/api/users/route.ts` (GET)
- `app/api/users/[id]/toggle-super-admin/route.ts` (POST)
- `app/api/users/me/route.ts` (PATCH)
- `app/api/users/me/settings/route.ts` (GET, POST)
- `app/api/users/me/password/route.ts` (POST)

**Endpoints:**
- `GET /api/users?page=1&limit=10` - Lista usuarios por institución
- `POST /api/users/:id/toggle-super-admin` - Toggle SuperAdmin (solo SuperAdmin)
- `PATCH /api/users/me` - Actualiza nombre del usuario actual
- `GET /api/users/me/settings` - Obtiene settings del usuario actual
- `POST /api/users/me/settings` - Actualiza settings (merge con existentes)
- `POST /api/users/me/password` - Cambia contraseña (vía Better Auth)

**Lógica especial:**
- `toggleSuperAdmin()` requiere permisos de SuperAdmin
- `updateSettings()` hace merge con settings existentes (no reemplaza)
- Cambio de contraseña usa Better Auth API
- Paginación estándar

---

### ✅ 2. Dashboard (Estadísticas)
**Archivos creados:**
- `app/api/dashboard/super-stats/route.ts` (GET)
- `app/api/dashboard/institution-stats/route.ts` (GET)

**Endpoints:**
- `GET /api/dashboard/super-stats` - Estadísticas globales (solo SuperAdmin)
- `GET /api/dashboard/institution-stats` - Estadísticas de institución

**Lógica especial:**
- `super-stats`: Requiere SuperAdmin, muestra stats de toda la plataforma
  - Total instituciones, usuarios, recursos, préstamos
  - Préstamos activos y vencidos
  - Últimas 5 instituciones creadas
- `institution-stats`: Stats por institución
  - Total personal, recursos, préstamos, reuniones
  - Recursos disponibles
  - Préstamos activos y vencidos
- Usa `Promise.all()` para queries paralelas

---

### ✅ 3. ResourceTemplates (Plantillas de Recursos)
**Archivos creados:**
- `lib/validations/schemas/resource-templates.ts`
- `app/api/resource-templates/route.ts` (GET, POST)
- `app/api/resource-templates/[id]/route.ts` (PUT, DELETE)

**Endpoints:**
- `GET /api/resource-templates?page=1&limit=10&categoryId=xxx` - Lista plantillas
- `POST /api/resource-templates` - Crea plantilla
- `PUT /api/resource-templates/:id` - Actualiza plantilla
- `DELETE /api/resource-templates/:id` - Elimina plantilla

**Validaciones:**
- name (required)
- categoryId (optional)
- icon (optional)
- defaultBrand (optional)
- defaultModel (optional)
- isDefault (optional, default false)
- sortOrder (optional, default 0)

**Lógica especial:**
- Paginación con filtro opcional por categoryId
- Ordenamiento por sortOrder y name

---

### ✅ 4. Staff (Personal)
**Archivos creados:**
- `lib/validations/schemas/staff.ts`
- `app/api/staff/route.ts` (GET, POST)
- `app/api/staff/bulk/route.ts` (POST)
- `app/api/staff/recurrent/route.ts` (GET)
- `app/api/staff/[id]/route.ts` (PATCH, DELETE)

**Endpoints:**
- `GET /api/staff?page=1&limit=10&search=xxx&role=xxx&status=xxx&include_admins=true` - Lista personal
- `POST /api/staff` - Crea personal
- `POST /api/staff/bulk` - Crea múltiples personal (batch)
- `GET /api/staff/recurrent?limit=6` - Personal más recurrente (por préstamos)
- `PATCH /api/staff/:id` - Actualiza personal
- `DELETE /api/staff/:id` - Elimina personal

**Validaciones:**
- name (required)
- dni (optional)
- email (optional, validación de email)
- phone (optional)
- area (optional)
- role (default 'docente')

**Lógica especial:**
- `include_admins=true`: Mezcla staff con usuarios admin/superadmin
  - Mapea usuarios a estructura de staff
  - Deduplica por ID
  - Agrega admins al inicio de la primera página
- `findRecurrent()`: Usa GROUP BY con count de préstamos
- Validación de duplicados (email, DNI) por institución
- Solo SuperAdmin puede crear/asignar roles admin/superadmin
- Búsqueda por nombre, DNI, email, área

---

### ✅ 5. Categories (Categorías)
**Archivos creados:**
- `lib/validations/schemas/categories.ts`
- `lib/constants/default-templates.ts`
- `app/api/categories/route.ts` (GET, POST)
- `app/api/categories/[id]/route.ts` (PUT, DELETE)

**Endpoints:**
- `GET /api/categories?has_resources=true` - Lista categorías
- `POST /api/categories` - Crea categoría con auto-seed
- `PUT /api/categories/:id` - Actualiza categoría
- `DELETE /api/categories/:id` - Elimina categoría (valida recursos)

**Validaciones:**
- name (required)
- icon (optional)
- color (optional)

**Lógica especial:**
- `has_resources=true`: Filtra solo categorías con recursos asociados (INNER JOIN)
- **Auto-seed de templates**: Al crear categoría, si el nombre coincide con DEFAULT_TEMPLATES:
  - Crea automáticamente plantillas predefinidas
  - Previene duplicados (idempotencia)
  - No bloquea si falla el seed
- DELETE valida que no haya recursos asociados
- 15 categorías predefinidas con templates (Mantenimiento, Equipos Portátiles, etc.)

---

## 📊 Resumen de Archivos Creados

### Esquemas Zod (5 archivos)
- `lib/validations/schemas/users.ts`
- `lib/validations/schemas/resource-templates.ts`
- `lib/validations/schemas/staff.ts`
- `lib/validations/schemas/categories.ts`

### Constantes (1 archivo)
- `lib/constants/default-templates.ts`

### Route Handlers (14 archivos)
- `app/api/users/route.ts`
- `app/api/users/[id]/toggle-super-admin/route.ts`
- `app/api/users/me/route.ts`
- `app/api/users/me/settings/route.ts`
- `app/api/users/me/password/route.ts`
- `app/api/dashboard/super-stats/route.ts`
- `app/api/dashboard/institution-stats/route.ts`
- `app/api/resource-templates/route.ts`
- `app/api/resource-templates/[id]/route.ts`
- `app/api/staff/route.ts`
- `app/api/staff/bulk/route.ts`
- `app/api/staff/recurrent/route.ts`
- `app/api/staff/[id]/route.ts`
- `app/api/categories/route.ts`
- `app/api/categories/[id]/route.ts`

**Total:** 20 archivos creados

---

## ✅ Patrones Implementados

### 1. Autenticación y Roles
```typescript
await requireAuth(request); // Usuario autenticado
await requireSuperAdmin(request); // Solo SuperAdmin
const institutionId = await getInstitutionId(request);
```

### 2. Queries Paralelas (Dashboard)
```typescript
const [stat1, stat2, stat3] = await Promise.all([
  db.select({ count: count() }).from(table1),
  db.select({ count: count() }).from(table2),
  db.select({ count: count() }).from(table3),
]);
```

### 3. Merge de Settings (Users)
```typescript
const currentSettings = (user.settings as Record<string, any>) || {};
const mergedSettings = { ...currentSettings, ...newSettings };
```

### 4. Batch Insert (Staff, Categories)
```typescript
const values = items.map(item => ({ id: randomUUID(), ...item }));
await db.insert(table).values(values).returning();
```

### 5. Auto-seed con Idempotencia (Categories)
```typescript
const existingNames = new Set(existing.map(t => t.name));
const toCreate = defaults.filter(t => !existingNames.has(t.name));
if (toCreate.length > 0) {
  await db.insert(templates).values(toCreate);
}
```

### 6. Búsqueda con ILIKE (Staff)
```typescript
const searchLower = `%${search.toLowerCase()}%`;
or(
  ilike(staff.name, searchLower),
  ilike(staff.email, searchLower),
  ilike(staff.dni, searchLower)
)
```

### 7. GROUP BY con Agregación (Staff Recurrent)
```typescript
const recurrent = await db
  .select({
    staff: staff,
    loanCount: sql<number>`count(${loans.id})`.mapWith(Number),
  })
  .from(staff)
  .leftJoin(loans, eq(loans.staffId, staff.id))
  .groupBy(staff.id)
  .orderBy(desc(sql`count(${loans.id})`));
```

---

## 🎯 Estado del Proyecto

- ✅ **Fase 1: Infraestructura Base** - COMPLETADA
- ✅ **Fase 2: Módulos Simples (5)** - COMPLETADA
- ✅ **Fase 3: Módulos Intermedios (5)** - COMPLETADA
- ⏳ Fase 4: Módulos Complejos (4)
- ⏳ Fase 5: Módulo Crítico (Institutions)
- ⏳ Fase 6: Testing y Cleanup

**Progreso:** 3/6 fases completadas (50%)

---

## 📝 Próximos Pasos

### Fase 4: Módulos Complejos

1. **Resources** - Inventario con CQRS, batch creation, mantenimiento
2. **Loans** - Préstamos con workflow, damage reports
3. **Reservations** - Reservas de aulas con slots, conflictos
4. **Meetings** - Reuniones con asistencia y tareas

Ver [ORDEN_MIGRACION.md](./ORDEN_MIGRACION.md) para detalles.

---

## 🧪 Testing Recomendado

Para cada módulo migrado, probar:

1. ✅ Endpoints básicos (GET, POST, PUT, DELETE)
2. ✅ Validaciones Zod
3. ✅ Multi-tenancy (no ver datos de otras instituciones)
4. ✅ Autenticación (401 sin token)
5. ✅ Autorización (403 sin permisos)
6. ✅ Lógica especial:
   - Users: Toggle SuperAdmin, merge settings, cambio contraseña
   - Dashboard: Stats correctas, queries paralelas
   - Staff: include_admins, recurrent, bulk create
   - Categories: Auto-seed templates, validación de recursos

---

## 📚 Documentación Relacionada

- [PLAN_MIGRACION_NEXTJS.md](./PLAN_MIGRACION_NEXTJS.md) - Plan general
- [ORDEN_MIGRACION.md](./ORDEN_MIGRACION.md) - Orden detallado
- [INFRAESTRUCTURA_BASE_COMPLETADA.md](./INFRAESTRUCTURA_BASE_COMPLETADA.md) - Fase 1
- [FASE2_MODULOS_SIMPLES_COMPLETADA.md](./FASE2_MODULOS_SIMPLES_COMPLETADA.md) - Fase 2
