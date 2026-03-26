# Optimización de Búsqueda de Personal

## Cambios Implementados

### 1. Ampliación de Campos de Búsqueda

La búsqueda ahora incluye **6 campos** en lugar de 4:

- ✅ Nombre
- ✅ DNI
- ✅ Email
- ✅ Teléfono (NUEVO)
- ✅ Área (ya existía)
- ✅ Rol (NUEVO)

### 2. Índices de Base de Datos

Se agregaron índices para optimizar las búsquedas:

```sql
CREATE INDEX "idx_staff_phone" ON "staff" USING btree ("phone");
CREATE INDEX "idx_staff_area" ON "staff" USING btree ("area");
```

**Índices existentes:**
- `idx_staff_name` - Búsqueda por nombre
- `idx_staff_institution_dni` - Búsqueda por DNI (unique)
- `idx_staff_institution_email` - Búsqueda por email (unique)
- `idx_staff_role` - Búsqueda por rol
- `idx_staff_status` - Filtro por estado

### 3. Búsqueda en Admins

La búsqueda de administradores también se amplió para incluir DNI:

```typescript
or(
  ilike(users.name, searchLower),
  ilike(users.email, searchLower),
  ilike(users.dni, searchLower) // NUEVO
)
```

### 4. Optimizaciones de Performance

#### a) Queries Paralelas
```typescript
const [staffData, totalStaffResult] = await Promise.all([
  db.query.staff.findMany(...),
  db.select({ value: count() }).from(staff).where(whereClause),
]);
```

#### b) Set para Lookups O(1)
```typescript
const staffEmailSet = new Set(
  staffData.map((s) => s.email?.toLowerCase()).filter(Boolean)
);
```

#### c) Placeholder Data en React Query
```typescript
placeholderData: (previousData) => previousData,
```
Mantiene los datos anteriores mientras carga la siguiente página.

#### d) Stale Time Optimizado
```typescript
staleTime: 2 * 60 * 1000, // 2 minutos
```
Los datos de personal no cambian frecuentemente.

## Archivos Modificados

1. `apps/web/src/app/api/staff/route.ts`
   - Ampliada búsqueda a 6 campos
   - Búsqueda de admins incluye DNI

2. `apps/web/src/features/staff/components/staff-list.tsx`
   - Actualizado placeholder del input de búsqueda

3. `apps/web/src/lib/db/schema.ts`
   - Agregados índices para `phone` y `area`

4. `apps/web/drizzle/20260326094050_add_staff_search_indexes.sql`
   - Migración para crear los nuevos índices

## Impacto en Performance

### Antes
- Búsqueda en 4 campos
- Sin índices en `phone` y `area`
- Búsqueda de admins sin DNI

### Después
- ✅ Búsqueda en 6 campos (50% más cobertura)
- ✅ Índices en todos los campos de búsqueda
- ✅ Búsqueda completa en admins
- ✅ Queries optimizadas con Promise.all
- ✅ Lookups O(1) con Set

## Ejemplos de Búsqueda

Ahora puedes buscar por:

```
"Juan"           → Encuentra por nombre
"12345678"       → Encuentra por DNI
"juan@mail.com"  → Encuentra por email
"987654321"      → Encuentra por teléfono
"Matemática"     → Encuentra por área
"admin"          → Encuentra por rol
```

## Próximas Mejoras (Opcional)

1. **Full-Text Search**: Implementar búsqueda de texto completo con PostgreSQL
2. **Fuzzy Search**: Búsqueda tolerante a errores tipográficos
3. **Search Highlighting**: Resaltar términos de búsqueda en resultados
4. **Search History**: Guardar búsquedas recientes del usuario
5. **Advanced Filters**: Filtros combinados (rol + área + estado)
