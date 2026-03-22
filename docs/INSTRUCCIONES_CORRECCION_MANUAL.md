# 🔧 Instrucciones para Corrección Manual de Errores TypeScript

**Fecha**: 2026-03-21  
**Estado**: ⏳ EN PROGRESO

---

## RESUMEN

Se detectaron 235 errores de TypeScript debido a cambios en Next.js 15. Los helpers ya fueron actualizados, pero los route handlers necesitan corrección manual.

---

## ✅ COMPLETADO

### 1. Helpers Actualizados

- ✅ `requireAuth()` - Ahora retorna `AuthResult` con tipos correctos
- ✅ `getInstitutionId()` - Ahora acepta `user` o `AuthResult` (NO es async)
- ✅ `requireRole()` - Valida `user.role` correctamente (no null)
- ✅ `successResponse()` - Acepta mensaje como segundo parámetro

### 2. Archivos Actualizados Manualmente

- ✅ `apps/web/src/lib/auth/helpers.ts`
- ✅ `apps/web/src/lib/utils/response.ts`
- ✅ `apps/web/src/app/api/loans/[id]/approve/route.ts`

---

## ⏳ PENDIENTE: Actualizar Route Handlers con Params

### Patrón a Buscar y Reemplazar

Usa el editor de tu IDE (VS Code, WebStorm, etc.) con búsqueda y reemplazo con regex:

#### Búsqueda 1: Firma de Función

**Buscar (Regex):**
```
\{ params \}: \{ params: \{ (\w+): string \} \}
```

**Reemplazar:**
```
{ params }: { params: Promise<{ $1: string }> }
```

#### Búsqueda 2: Destructuring de Params

**Buscar (Regex):**
```
const \{ (\w+) \} = params;
```

**Reemplazar:**
```
const { $1 } = await params;
```

---

## ARCHIVOS A ACTUALIZAR (29 archivos)

### Categorías

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
15. `src/app/api/loans/[id]/reject/route.ts`
16. `src/app/api/loans/[id]/return/route.ts`
17. `src/app/api/meetings/[id]/attendance/route.ts`
18. `src/app/api/meetings/[id]/route.ts`
19. `src/app/api/meetings/[id]/tasks/route.ts`
20. `src/app/api/meetings/attendance/[attendanceId]/route.ts`
21. `src/app/api/meetings/tasks/[taskId]/route.ts`
22. `src/app/api/pedagogical-hours/[id]/route.ts`
23. `src/app/api/resource-templates/[id]/route.ts`
24. `src/app/api/resources/[id]/last-damage-report/route.ts`
25. `src/app/api/resources/[id]/route.ts`
26. `src/app/api/sections/[id]/route.ts`
27. `src/app/api/staff/[id]/route.ts`
28. `src/app/api/users/[id]/toggle-super-admin/route.ts`

---

## EJEMPLO DE CORRECCIÓN

### Antes (❌ Incorrecto)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(request);
    onst institutionId = await getInstitutionId(user); // ❌ Sin await

    const { id } = await params; // ❌ Sin await

    const item = await db.query.items.findFirst({
      where: and(
        eq(items.id, id),
        eq(items.institutionId, institutionId) // ❌ institutionId es Promise
      ),
    });

    return successResponse(item);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Después (✅ Correcto)

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Promise
) {
  try {
    const { user } = await requireAuth(request);
    onst institutionId = await getInstitutionId(user); // ✅ Ya no es async

    const { id } = await params; // ✅ Await params

    const item = await db.query.items.findFirst({
      where: and(
        eq(items.id, id),
        eq(items.institutionId, institutionId) // ✅ institutionId es string
      ),
    });

    return successResponse(item);
  } catch (error) {
    return errorResponse(error);
  }
}
```

---

## INSTRUCCIONES PASO A PASO

### Opción A: Búsqueda y Reemplazo Global (RECOMENDADO)

1. Abre VS Code o tu IDE
2. Presiona `Ctrl+Shift+H` (Windows) o `Cmd+Shift+H` (Mac)
3. Activa "Use Regular Expression" (icono `.*`)
4. En "Files to include" escribe: `apps/web/src/app/api/**/[*]/route.ts`
5. Ejecuta las 2 búsquedas y reemplazos descritos arriba

### Opción B: Archivo por Archivo

1. Abre cada archivo de la lista
2. Busca `{ params }: { params: {` y reemplaza con `{ params }: { params: Promise<{`
3. Busca `const { id } = await params;` y reemplaza con `const { id } = await params;`
4. Repite para `slotId`, `taskId`, `attendanceId`

---

## VERIFICACIÓN

Después de hacer los cambios, ejecuta:

```bash
cd apps/web
pnpm run typecheck
```

**Resultado esperado**: 0 errores (o solo warnings menores)

---

## OTROS ERRORES MENORES

### Variables No Usadas

Elimina los imports no usados:

```typescript
// ❌ Eliminar
import { eq, sql } from 'drizzle-orm'; // 'sql' no usado

// ✅ Correcto
import { eq } from 'drizzle-orm';
```

### Parámetros Opcionales

Valida que `page` y `limit` no sean undefined:

```typescript
// ❌ Incorrecto
const offset = (page - 1) * limit; // page y limit pueden ser undefined

// ✅ Correcto
const page = query.page || 1;
const limit = query.limit || 10;
const offset = (page - 1) * limit;
```

---

## ESTADO ACTUAL

- ✅ Helpers actualizados
- ✅ Response helpers actualizados
- ⏳ 28 route handlers pendientes de actualizar
- ⏳ Variables no usadas pendientes de limpiar

---

**Próximo paso**: Ejecutar búsqueda y reemplazo global en VS Code

