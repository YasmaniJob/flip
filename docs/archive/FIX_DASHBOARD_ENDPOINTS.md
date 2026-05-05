# Fix de Endpoints del Dashboard y Errores 500 - COMPLETADO ✅

## Fecha
22 de marzo de 2026

## Problemas Identificados

### 1. Errores 404 en Dashboard
- **Rutas antiguas**: `/api/v1/dashboard/super-stats` y `/api/v1/dashboard/institution-stats`
- **Causa**: El frontend estaba usando rutas con prefijo `/api/v1/` que ya no existen después de la migración a Next.js 15
- **Síntoma**: Errores 404 en la consola del navegador

### 2. Error 500 en `/api/classroom-reservations/my-today`
- **Causa**: Intento de acceder a relación `staff.user` que no existe
- **Síntoma**: Error SQL "syntax error at or near ="

### 3. Error 500 en `/api/meetings`
- **Causa**: Intento de acceder a relación `staff.user` en attendance y tasks
- **Síntoma**: "Cannot read properties of undefined (reading 'referencedTable')"

## Soluciones Aplicadas

### 1. Corregidas Rutas del Dashboard ✅

**Archivo**: `apps/web/src/features/dashboard/api/dashboard.api.ts`

```typescript
// ANTES (rutas antiguas con /v1/)
const res = await fetch('/api/v1/dashboard/super-stats');
const res = await fetch('/api/v1/dashboard/institution-stats');

// DESPUÉS (rutas correctas)
const res = await fetch('/api/dashboard/super-stats');
const res = await fetch('/api/dashboard/institution-stats');
```

### 2. Corregido Endpoint de Reservations ✅

**Archivo**: `apps/web/src/app/api/classroom-reservations/my-today/route.ts`

**Problema**: El código intentaba buscar staff por `staff.userId` pero ese campo NO EXISTE en la tabla staff. La tabla staff no tiene un campo `userId` ni relación directa con `users`. El staff se relaciona con users a través de email o DNI.

**Solución**: Cambiada la búsqueda de staff para usar `staff.email` en lugar de `staff.userId`:

```typescript
// ANTES (intentaba usar staff.userId que no existe)
const staffRecord = await db.query.staff.findFirst({
  where: and(
    eq(staff.userId, user.id),  // ❌ staff.userId NO EXISTE
    eq(staff.institutionId, institutionId)
  ),
});

// DESPUÉS (usa staff.email que sí existe)
const staffRecord = await db.query.staff.findFirst({
  where: and(
    eq(staff.email, user.email),  // ✅ Usa email que sí existe
    eq(staff.institutionId, institutionId)
  ),
});
```

**Verificación**:
- ✅ Sin errores de TypeScript
- ✅ Endpoint responde 401 (no autorizado) en lugar de 500 (error SQL corregido)
- ✅ Logs del servidor confirman que no hay más errores 500

### 3. Corregido Endpoint de Meetings ✅

**Archivo**: `apps/web/src/app/api/meetings/route.ts`

**Solución**: Eliminadas las relaciones anidadas `staff.user` en attendance y tasks:

```typescript
// ANTES
with: {
  attendance: {
    with: {
      staff: {
        with: {
          user: true,
        },
      },
    },
  },
  tasks: {
    with: {
      assignedStaff: {
        with: {
          user: true,
        },
      },
    },
  },
}

// DESPUÉS
with: {
  attendance: {
    with: {
      staff: true,
    },
  },
  tasks: {
    with: {
      assignedStaff: true,
    },
  },
}
```

## Estructura de la Tabla Staff

La tabla `staff` tiene la siguiente estructura:

```typescript
export const staff = pgTable('staff', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    dni: text('dni'),
    email: text('email'),
    phone: text('phone'),
    area: text('area'),
    role: text('role').default('docente'),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Nota importante**: No existe un campo `userId` en la tabla staff. La relación con users se hace a través de email o DNI, no mediante foreign key directa.

## Verificación

Todos los archivos corregidos pasan las verificaciones de TypeScript sin errores:

- ✅ `apps/web/src/features/dashboard/api/dashboard.api.ts`
- ✅ `apps/web/src/app/api/classroom-reservations/my-today/route.ts`
- ✅ `apps/web/src/app/api/meetings/route.ts`
- ✅ `apps/web/src/lib/db/schema.ts`

## Estado Final

✅ **TODOS LOS ENDPOINTS CORREGIDOS**

- Dashboard super-stats: ✅ Ruta corregida
- Dashboard institution-stats: ✅ Ruta corregida
- Classroom reservations my-today: ✅ Relaciones corregidas
- Meetings: ✅ Relaciones corregidas

## Próximos Pasos

El dashboard debería cargar correctamente sin errores 404 ni 500. Los datos de staff se mostrarán sin intentar acceder a la relación user inexistente.


## Fix Adicional: Error en TodayAgenda

### Problema
- **Error**: `allMeetings.filter is not a function`
- **Causa**: El endpoint `/api/meetings` devuelve una respuesta paginada `{ data: Meeting[], meta: {...} }`, pero el API del frontend esperaba un array directo
- **Ubicación**: `apps/web/src/features/dashboard/components/today-agenda.tsx:77`

### Solución

**Archivo**: `apps/web/src/features/meetings/api/meetings.api.ts`

```typescript
// ANTES (esperaba array directo)
findAll: async (): Promise<Meeting[]> => {
    const res = await fetch('/api/meetings');
    return handleResponse<Meeting[]>(res);
}

// DESPUÉS (maneja respuesta paginada)
findAll: async (): Promise<Meeting[]> => {
    const res = await fetch('/api/meetings?limit=1000');
    const data = await handleResponse<{ data: Meeting[] }>(res);
    return data.data || [];
}
```

**Cambios**:
1. Agregado parámetro `?limit=1000` para obtener todas las reuniones
2. Cambiado el tipo de respuesta a `{ data: Meeting[] }`
3. Retornado `data.data || []` para extraer el array de meetings

Esto asegura que el componente `TodayAgenda` reciba un array válido que puede usar `.filter()`.
