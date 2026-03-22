# ❌ Errores de TypeScript - Next.js 15

**Fecha**: 2026-03-21  
**Estado**: 🔴 235 ERRORES DETECTADOS

---

## RESUMEN

El typecheck detectó 235 errores de TypeScript en 31 archivos. Los errores se dividen en 3 categorías principales:

### 1. **BREAKING CHANGE: `params` es ahora `Promise` en Next.js 15** (29 errores)
   - En Next.js 15, los `params` en route handlers son `Promise<{ id: string }>` en lugar de `{ id: string }`
   - Afecta a TODOS los route handlers con parámetros dinámicos `[id]`, `[slotId]`, `[taskId]`, `[attendanceId]`

### 2. **Helper `requireAuth()` requiere `request` como parámetro** (100+ errores)
   - Todos los llamados a `requireAuth()` están sin parámetro
   - Debe ser `requireAuth(request)` en lugar de `requireAuth()`

### 3. **`institutionId` es `Promise<string>` en lugar de `string`** (80+ errores)
   - `getInstitutionId()` retorna `Promise<string>` pero se usa como `string`
   - Causa errores en comparaciones y en queries de drizzle-orm

### 4. **Otros errores menores** (26 errores)
   - Variables no usadas
   - Parámetros opcionales sin validación
   - Tipos incorrectos en response helpers

---

## CATEGORÍA 1: `params` es `Promise` en Next.js 15

### Archivos Afectados (29 errores)

```
.next/types/validator.ts:270 - 29 errores de validación de tipos
```

### Ejemplo de Error

```typescript
// ❌ INCORRECTO (Next.js 14)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ❌ Error: params es Promise
}

// ✅ CORRECTO (Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ Await params
}
```

### Archivos a Corregir

1. `src/app/api/categories/[id]/route.ts`
2. `src/app/api/classroom-reservations/[id]/attendance/bulk/route.ts`
3. `src/app/api/classroom-reservations/[id]/attendance/route.ts`
4. `src/app/api/classroom-reservations/[id]/cancel/route.ts`
5. `src/app/api/classroom-reservations/[id]/reschedule-block/route.ts`
6. `src/app/api/classroom-reservations/[id]/tasks/route.ts`
7. `src/app/api/classroom-reservations/attendance/[attendanceId]/route.ts`
8. `src/app/api/classroom-reservations/slots/[slotId]/attendance/route.ts`
9. `src/app/api/classroom-reservations/slots/[slotId]/reschedule/route.ts`
10. `src/app/api/classroom-reservations/slots/[slotId]/route.ts`
11. `src/app/api/classroom-reservations/tasks/[taskId]/route.ts`
12. `src/app/api/classrooms/[id]/route.ts`
13. `src/app/api/curricular-areas/[id]/route.ts`
14. `src/app/api/grades/[id]/route.ts`
15. `src/app/api/loans/[id]/approve/route.ts`
16. `src/app/api/loans/[id]/reject/route.ts`
17. `src/app/api/loans/[id]/return/route.ts`
18. `src/app/api/meetings/[id]/attendance/route.ts`
19. `src/app/api/meetings/[id]/route.ts`
20. `src/app/api/meetings/[id]/tasks/route.ts`
21. `src/app/api/meetings/attendance/[attendanceId]/route.ts`
22. `src/app/api/meetings/tasks/[taskId]/route.ts`
23. `src/app/api/pedagogical-hours/[id]/route.ts`
24. `src/app/api/resource-templates/[id]/route.ts`
25. `src/app/api/resources/[id]/last-damage-report/route.ts`
26. `src/app/api/resources/[id]/route.ts`
27. `src/app/api/sections/[id]/route.ts`
28. `src/app/api/staff/[id]/route.ts`
29. `src/app/api/users/[id]/toggle-super-admin/route.ts`

---

## CATEGORÍA 2: `requireAuth()` sin parámetro

### Ejemplo de Error

```typescript
// ❌ INCORRECTO
const user = await requireAuth(); // Error: Expected 1 arguments, but got 0

// ✅ CORRECTO
const user = await requireAuth(request);
```

### Archivos Afectados (100+ errores)

Todos los archivos que usan `requireAuth()` sin pasar `request`.

---

## CATEGORÍA 3: `institutionId` es `Promise<string>`

### Ejemplo de Error

```typescript
// ❌ INCORRECTO
const user = await requireAuth();
onst institutionId = await getInstitutionId(user); // Retorna Promise<string>

// Uso en query
eq(classroomReservations.institutionId, institutionId) // ❌ Error: Promise<string> no es string

// ✅ CORRECTO
const { user } = await requireAuth(request);
const institutionId = await getInstitutionId(user); // Await el Promise

// Uso en query
eq(classroomReservations.institutionId, institutionId) // ✅ Correcto
```

### Archivos Afectados (80+ errores)

Todos los archivos que usan `getInstitutionId()` sin `await`.

---

## CATEGORÍA 4: Otros Errores

### 4.1 Variables No Usadas (6 errores)

```typescript
// src/app/api/categories/route.ts:9
import { eq, sql } from 'drizzle-orm'; // ❌ 'sql' no usado

// src/app/api/classrooms/route.ts:8
import { eq, and, asc } from 'drizzle-orm'; // ❌ 'and' no usado
```

### 4.2 Parámetros Opcionales sin Validación (10 errores)

```typescript
// src/app/api/loans/route.ts:22
const offset = (page - 1) * limit; // ❌ 'page' y 'limit' pueden ser undefined
```

### 4.3 Response Helpers con Argumentos Incorrectos (10 errores)

```typescript
// ❌ INCORRECTO
return successResponse(data, 'Mensaje', 201); // 3 argumentos

// ✅ CORRECTO
return successResponse(data, 'Mensaje'); // 2 argumentos
// O usar NextResponse directamente para status code
return NextResponse.json({ success: true, data, message: 'Mensaje' }, { status: 201 });
```

---

## SOLUCIÓN PROPUESTA

### Opción A: Corrección Manual (RECOMENDADO)

Corregir los errores en 3 fases:

#### Fase 1: Actualizar Helpers (CRÍTICO)
1. Actualizar `requireAuth()` para que funcione sin `request` O actualizar todos los llamados
2. Actualizar `getInstitutionId()` para que NO sea async O agregar `await` en todos los usos

#### Fase 2: Actualizar Route Handlers con `params`
1. Cambiar firma de función: `{ params: { id: string } }` → `{ params: Promise<{ id: string }> }`
2. Agregar `await` al destructurar: `const { id } = await params;`

#### Fase 3: Limpiar Warnings
1. Eliminar imports no usados
2. Validar parámetros opcionales
3. Corregir llamados a response helpers

### Opción B: Corrección Automática con Script

Crear un script que:
1. Busque todos los route handlers con `params`
2. Reemplace la firma de función
3. Agregue `await` al destructurar

---

## PRIORIDAD

### 🔴 CRÍTICO (Bloquea compilación)
- Categoría 1: `params` es `Promise`
- Categoría 2: `requireAuth()` sin parámetro
- Categoría 3: `institutionId` es `Promise<string>`

### 🟡 IMPORTANTE (Warnings)
- Categoría 4.1: Variables no usadas
- Categoría 4.2: Parámetros opcionales

### 🟢 MENOR (Mejoras)
- Categoría 4.3: Response helpers

---

## SIGUIENTE PASO

**DECISIÓN REQUERIDA**: ¿Qué enfoque prefieres?

1. **Opción A**: Corrección manual en 3 fases (más control, más tiempo)
2. **Opción B**: Script automático + revisión manual (más rápido, menos control)

**RECOMENDACIÓN**: Opción A - Fase 1 primero (actualizar helpers), luego Fase 2 (params).

---

**Ejecutado por**: Kiro AI Assistant  
**Fecha**: 21 de marzo de 2026  
**Total de errores**: 235  
**Archivos afectados**: 31

