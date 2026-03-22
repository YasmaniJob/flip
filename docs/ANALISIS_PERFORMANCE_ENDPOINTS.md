# 🔍 Análisis de Performance - Endpoints Lentos en Producción

**Fecha:** 22 de Marzo, 2026  
**Objetivo:** Identificar cuellos de botella en endpoints críticos

---

## 📊 Endpoints Analizados

1. `/api/dashboard/institution-stats` - Dashboard stats
2. `/api/resources` - Listado de inventario
3. `/api/loans` - Listado de préstamos
4. `/api/classroom-reservations` - Listado de reservas
5. `/api/institutions/my-institution` - Datos de institución

---

## 🚨 Problemas Críticos Encontrados

### 1. `/api/loans` - PROBLEMA SEVERO (N+1 Queries)

**Archivo:** `apps/web/src/app/api/loans/route.ts`

#### Problemas Identificados:

**A. Query N+1 en batch queries (Líneas 40-60)**
```typescript
// Primero trae todos los loans con relaciones
const loansData = await db.query.loans.findMany({
  with: {
    staff: true,
    loanResources: {
      with: {
        resource: {
          with: { category: true },
        },
      },
    },
  },
});

// Luego hace 3 queries adicionales para nombres
const [gradesData, sectionsData, areasData] = await Promise.all([
  gradeIds.length > 0 ? db.query.grades.findMany(...) : [],
  sectionIds.length > 0 ? db.query.sections.findMany(...) : [],
  areaIds.length > 0 ? db.query.curricularAreas.findMany(...) : [],
]);

// Y otra query más para usuarios
const usersResult = userIds.length > 0 
  ? await db.query.users.findMany(...) 
  : [];
```

**Impacto:** 5 queries por request (1 principal + 4 batch queries)

**B. Cálculo de overdue en memoria (Línea 75-80)**
```typescript
const today = new Date();
const calculatedStatus = loan.status === 'active' && loanDate < today 
  ? 'overdue' 
  : loan.status;
```

**Impacto:** Se calcula para CADA loan en JavaScript en lugar de en la DB

**C. Mapeo complejo de datos (Líneas 82-110)**
- Múltiples `.map()` anidados
- Construcción de objetos complejos
- Lookups en Maps para cada loan

#### Soluciones Propuestas:

1. **Usar SQL JOIN en lugar de batch queries**
   - Traer grades, sections, areas en el query principal
   - Eliminar las 3 queries adicionales

2. **Calcular overdue en la DB**
   ```sql
   CASE 
     WHEN status = 'active' AND loan_date < CURRENT_DATE 
     THEN 'overdue' 
     ELSE status 
   END as calculated_status
   ```

3. **Simplificar el mapeo de datos**
   - Usar SQL para formatear la respuesta
   - Reducir transformaciones en JavaScript

**Impacto Estimado:** Reducción de 70-80% en tiempo de respuesta

---

### 2. `/api/classroom-reservations` - PROBLEMA CRÍTICO (N+1 Masivo)

**Archivo:** `apps/web/src/app/api/classroom-reservations/route.ts`

#### Problemas Identificados:

**A. Loop con awaits dentro (Líneas 35-80)**
```typescript
const reservationsWithRelations = await Promise.all(
  reservationsList.map(async (reservation) => {
    // Query 1: Load slots
    const slots = await db.query.reservationSlots.findMany(...);
    
    // Query 2-N: Load pedagogical hours for EACH slot
    const slotsWithHours = await Promise.all(
      slots.map(async (slot) => {
        const pedagogicalHour = await db.query.pedagogicalHours.findFirst(...);
        return { ...slot, pedagogicalHour };
      })
    );
    
    // Query N+1 to N+6: Load 6 more relations per reservation
    const [classroom, staffMember, grade, section, curricularArea] = await Promise.all([...]);
    
    // Query N+7: Load user for staff
    const userForStaff = await db.query.users.findFirst(...);
  })
);
```

**Impacto:** 
- Si hay 10 reservas con 5 slots cada una:
  - 10 queries para reservations
  - 10 queries para slots
  - 50 queries para pedagogical hours (1 por slot)
  - 60 queries para relaciones (6 por reservation)
  - **Total: 130 queries!**

**B. Filtrado en memoria después de traer datos (Líneas 82-110)**
```typescript
// Trae TODAS las reservas y luego filtra en JavaScript
if (query.startDate || query.endDate) {
  filteredReservations = reservationsWithRelations
    .map((reservation) => ({
      ...reservation,
      slots: reservation.slots.filter((slot) => {
        // Filtrado en memoria
      }),
    }))
    .filter((reservation) => reservation.slots.length > 0);
}
```

**Impacto:** Trae datos innecesarios de la DB

#### Soluciones Propuestas:

1. **Usar Drizzle relations correctamente**
   - Configurar `with` para traer todo en 1-2 queries
   - Eliminar el loop manual

2. **Filtrar en la DB, no en memoria**
   ```typescript
   // Agregar filtros de fecha al query principal
   if (query.startDate) {
     conditions.push(gte(reservationSlots.date, query.startDate));
   }
   ```

3. **Usar LEFT JOIN para relaciones opcionales**
   - Traer classroom, grade, section, etc. en el query principal

**Impacto Estimado:** Reducción de 90-95% en tiempo de respuesta

---

### 3. `/api/resources` - PROBLEMA MODERADO

**Archivo:** `apps/web/src/app/api/resources/route.ts`

#### Problemas Identificados:

**A. Falta de índices en campos de búsqueda (Líneas 75-85)**
```typescript
if (search) {
  const term = `%${search}%`;
  conditions.push(
    or(
      like(resources.name, term),
      like(resources.brand, term),
      like(resources.model, term),
      like(resources.serialNumber, term),
      like(resources.internalId, term)
    )!
  );
}
```

**Impacto:** LIKE queries sin índices son lentas

**B. No hay paginación**
- Trae TODOS los recursos que coincidan
- Puede ser cientos o miles de registros

#### Soluciones Propuestas:

1. **Agregar índices en schema.ts**
   ```typescript
   nameIdx: index('idx_resource_name').on(table.name),
   brandIdx: index('idx_resource_brand').on(table.brand),
   serialIdx: index('idx_resource_serial').on(table.serialNumber),
   ```

2. **Implementar paginación**
   ```typescript
   const page = query.page ?? 1;
   const limit = query.limit ?? 50;
   const offset = (page - 1) * limit;
   ```

3. **Usar full-text search para búsquedas**
   - PostgreSQL tiene `to_tsvector` y `to_tsquery`
   - Mucho más rápido que múltiples LIKE

**Impacto Estimado:** Reducción de 50-60% en tiempo de respuesta

---

### 4. `/api/dashboard/institution-stats` - PROBLEMA MENOR

**Archivo:** `apps/web/src/app/api/dashboard/institution-stats/route.ts`

#### Problemas Identificados:

**A. 6 queries en paralelo (Líneas 15-40)**
```typescript
const [
  totalStaff,
  totalResources,
  availableResources,
  activeLoans,
  overdueLoans,
  totalMeetings,
] = await Promise.all([
  db.select({ count: count() }).from(staff)...,
  db.select({ count: count() }).from(resources)...,
  // ... 4 más
]);
```

**Impacto:** Moderado - ya usa Promise.all pero son 6 queries

#### Soluciones Propuestas:

1. **Combinar en 1-2 queries con UNION ALL**
   ```sql
   SELECT 'staff' as metric, COUNT(*) as count FROM staff WHERE ...
   UNION ALL
   SELECT 'resources', COUNT(*) FROM resources WHERE ...
   ```

2. **Cachear el resultado**
   - Stats no cambian cada segundo
   - Cache de 30-60 segundos sería suficiente

**Impacto Estimado:** Reducción de 30-40% en tiempo de respuesta

---

### 5. `/api/institutions/my-institution` - SIN PROBLEMAS

**Archivo:** `apps/web/src/app/api/institutions/my-institution/route.ts`

#### Estado:
✅ Query simple y directo  
✅ Ya tiene cache (revalidate = 300)  
✅ No necesita optimización

---

## 📈 Índices Faltantes en schema.ts

### Tabla: `resources`
```typescript
// Agregar en schema.ts
nameIdx: index('idx_resource_name').on(table.name),
brandIdx: index('idx_resource_brand').on(table.brand),
modelIdx: index('idx_resource_model').on(table.model),
serialIdx: index('idx_resource_serial').on(table.serialNumber),
internalIdx: index('idx_resource_internal').on(table.internalId),
statusConditionIdx: index('idx_resource_status_condition').on(table.status, table.condition),
```

### Tabla: `loans`
```typescript
// Ya existe institutionIdx, agregar:
statusIdx: index('idx_loan_status').on(table.status),
loanDateIdx: index('idx_loan_date').on(table.loanDate),
statusDateIdx: index('idx_loan_status_date').on(table.status, table.loanDate),
```

### Tabla: `classroom_reservations`
```typescript
// Agregar:
classroomDateIdx: index('idx_reservation_classroom_date').on(table.classroomId, table.createdAt),
statusIdx: index('idx_reservation_status').on(table.status),
```

### Tabla: `reservation_slots`
```typescript
// Agregar:
dateIdx: index('idx_slot_date').on(table.date),
classroomDateIdx: index('idx_slot_classroom_date').on(table.classroomId, table.date),
hourIdx: index('idx_slot_hour').on(table.pedagogicalHourId),
```

---

## 🎯 Prioridades de Optimización

### Prioridad CRÍTICA (Hacer YA):
1. ✅ **Agregar timing logs** (COMPLETADO)
2. 🔴 **Optimizar `/api/classroom-reservations`** - N+1 masivo
3. 🔴 **Optimizar `/api/loans`** - N+1 queries

### Prioridad ALTA:
4. 🟡 **Agregar índices faltantes** - Mejora general
5. 🟡 **Agregar paginación a `/api/resources`**

### Prioridad MEDIA:
6. 🟢 **Optimizar `/api/dashboard/institution-stats`** - Combinar queries

---

## 📝 Próximos Pasos

1. **Deploy con timing logs** - Ver tiempos reales en producción
2. **Revisar logs de Vercel** - Identificar el endpoint más lento
3. **Implementar optimizaciones** - Empezar por los críticos
4. **Medir mejoras** - Comparar tiempos antes/después

---

**Estado:** Análisis completado - Listo para implementar optimizaciones
