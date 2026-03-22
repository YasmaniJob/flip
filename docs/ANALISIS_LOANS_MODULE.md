# 📋 Análisis Completo: Módulo Loans

**Fecha:** 21 de marzo de 2026  
**Complejidad:** 🔴 Alta (Workflow de estados, actualización de recursos, JSON complejo)

---

## 🎯 Endpoints del Módulo

### 1. GET /api/loans
**Método:** GET  
**Ruta:** `/loans`  
**Roles:** Autenticado (AuthGuard)  
**Query params:**
```typescript
{
  page?: number;    // default 1
  limit?: number;   // default 10
}
```
**Lógica especial:**
- **Filtro por rol**: Docentes solo ven sus propios préstamos (filtro por `requestedByUserId`)
- **Admins/PIP**: Ven todos los préstamos de la institución
- **Joins complejos**: loans → staff → loanResources → resources → categories
- **Resolución de nombres**: grades, sections, curricularAreas (batch query)
- **Fallback staff → user**: Si `staffId` es null, busca en users por `requestedByUserId`
- **Status overdue**: Si `status='active'` y `loanDate < today`, retorna `status='overdue'`
- **Paginación**: Con meta (total, page, limit, lastPage)

---

### 2. POST /api/loans
**Método:** POST  
**Ruta:** `/loans`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  staffId?: string;           // Opcional (si es docente, puede ser null)
  resourceIds: string[];      // Required, array de IDs
  purpose?: string;
  notes?: string;
  gradeId?: string;           // Para purposeDetails
  sectionId?: string;         // Para purposeDetails
  curricularAreaId?: string;  // Para purposeDetails
  studentPickupNote?: string; // Nota del alumno que recoge
}
```
**Lógica especial:**
- **Validación de disponibilidad**: Verifica que todos los recursos existan y estén `status='disponible'`
- **Workflow por rol**:
  - **Docente** (`role='docente'`): Crea préstamo con `approvalStatus='pending'`
  - **Admin/PIP**: Crea préstamo con `approvalStatus='approved'`
- **Actualización de recursos**: Marca recursos como `status='prestado'` INMEDIATAMENTE (incluso si pending)
- **purposeDetails**: Se guarda como JSON con gradeId, sectionId, curricularAreaId
- **requestedByUserId**: Se guarda automáticamente desde `req.user.id`

---

### 3. PATCH /api/loans/:id/approve
**Método:** PATCH  
**Ruta:** `/loans/:id/approve`  
**Roles:** Admin/PIP (NO docente)  
**Body:** Ninguno  
**Lógica especial:**
- **Validación de rol**: Lanza `ForbiddenException` si `user.role === 'docente'`
- **Workflow**: `approvalStatus='pending'` → `approvalStatus='approved'`, `status='active'`
- **Actualización de recursos**: Marca recursos como `status='prestado'` (ya lo estaban, es idempotente)
- **Método de dominio**: `loan.approve()`

---

### 4. PATCH /api/loans/:id/reject
**Método:** PATCH  
**Ruta:** `/loans/:id/reject`  
**Roles:** Admin/PIP (NO docente)  
**Body:** Ninguno  
**Lógica especial:**
- **Validación de rol**: Lanza `ForbiddenException` si `user.role === 'docente'`
- **Workflow**: `approvalStatus='pending'` → `approvalStatus='rejected'`
- **Actualización de recursos**: Marca recursos como `status='disponible'` (libera recursos)
- **Método de dominio**: `loan.reject()`

---

### 5. PATCH /api/loans/:id/return
**Método:** PATCH  
**Ruta:** `/loans/:id/return`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  resourcesReceived: string[];  // IDs de recursos devueltos
  damageReports?: {
    [resourceId: string]: {
      commonProblems: string[];
      otherNotes?: string;
    }
  };
  suggestionReports?: {
    [resourceId: string]: {
      commonSuggestions: string[];
      otherNotes?: string;
    }
  };
  missingResources?: Array<{
    resourceId: string;
    resourceName: string;
    notes?: string;
  }>;
  resourceStatusDecisions?: {
    [resourceId: string]: 'disponible' | 'mantenimiento' | 'baja';
  };
}
```
**Lógica especial:**
- **Validación**: Solo si `status='active'` (no puede devolver un préstamo ya devuelto)
- **Workflow**: `status='active'` → `status='returned'`, `returnDate=now()`
- **Actualización de recursos**:
  - Recursos en `resourcesReceived`: Actualiza según `resourceStatusDecisions[resourceId]`
  - Si no hay decisión: `status='disponible'` (default)
  - Si decisión es 'mantenimiento' o 'baja': Actualiza individualmente
  - Recursos NO en `resourcesReceived`: Quedan como `status='prestado'` (implícitamente perdidos)
- **Guardado de reportes**: `damageReports`, `suggestionReports`, `missingResources` se guardan en JSON

---

## 🔄 Workflow de Estados

### approvalStatus (Aprobación)
```
pending → approved  (approve())
pending → rejected  (reject())
```

### status (Estado del préstamo)
```
active → returned   (return())
active → overdue    (calculado: loanDate < today)
```

### Combinaciones válidas:
- **Docente crea préstamo**: `approvalStatus='pending'`, `status='active'`
- **Admin aprueba**: `approvalStatus='approved'`, `status='active'`
- **Admin rechaza**: `approvalStatus='rejected'`, `status='active'` (recursos liberados)
- **Devuelto**: `approvalStatus='approved'`, `status='returned'`
- **Vencido**: `approvalStatus='approved'`, `status='overdue'` (calculado en GET)

---

## 🔧 Actualización de Recursos por Acción

### CREATE (POST /loans)
**Recursos:** `disponible` → `prestado`  
**Cuándo:** INMEDIATAMENTE (incluso si pending)  
**Por qué:** Prevenir double-booking

### APPROVE (PATCH /:id/approve)
**Recursos:** `prestado` → `prestado` (idempotente)  
**Cuándo:** Al aprobar préstamo pending  
**Por qué:** Ya estaban prestados desde CREATE

### REJECT (PATCH /:id/reject)
**Recursos:** `prestado` → `disponible`  
**Cuándo:** Al rechazar préstamo pending  
**Por qué:** Liberar recursos para otros préstamos

### RETURN (PATCH /:id/return)
**Recursos recibidos:**
- Si `resourceStatusDecisions[id] = 'disponible'`: `prestado` → `disponible`
- Si `resourceStatusDecisions[id] = 'mantenimiento'`: `prestado` → `mantenimiento`
- Si `resourceStatusDecisions[id] = 'baja'`: `prestado` → `baja`
- Si no hay decisión: `prestado` → `disponible` (default)

**Recursos NO recibidos:**
- Quedan como `prestado` (implícitamente perdidos/missing)

---

## 📦 Estructura de JSON

### damageReports
```typescript
{
  [resourceId: string]: {
    commonProblems: string[];  // Array de problemas comunes
    otherNotes?: string;       // Notas adicionales
  }
}
```

**Ejemplo:**
```json
{
  "res-123": {
    "commonProblems": ["Pantalla rayada", "Teclado pegajoso"],
    "otherNotes": "Requiere limpieza profunda"
  },
  "res-456": {
    "commonProblems": ["Batería hinchada"],
    otherNotes": "Urgente: reemplazar batería"
  }
}
```

### suggestionReports
```typescript
{
  [resourceId: string]: {
    commonSuggestions: string[];  // Array de sugerencias comunes
    otherNotes?: string;          // Notas adicionales
  }
}
```

**Ejemplo:**
```json
{
  "res-123": {
    "commonSuggestions": ["Actualizar software", "Agregar protector de pantalla"],
    "otherNotes": "Considerar reemplazo en 6 meses"
  }
}
```

### missingResources
```typescript
Array<{
  resourceId: string;
  resourceName: string;
  notes?: string;
}>
```

**Ejemplo:**
```json
[
  {
    "resourceId": "res-789",
    "resourceName": "Mouse inalámbrico",
    "notes": "Extraviado durante el préstamo"
  }
]
```

### purposeDetails
```typescript
{
  gradeId?: string;
  sectionId?: string;
  curricularAreaId?: string;
}
```

**Ejemplo:**
```json
{
  "gradeId": "grade-123",
  "sectionId": "section-456",
  "curricularAreaId": "area-789"
}
```

---

## 🔑 Puntos Críticos para la Migración

### 1. Filtro por Rol en GET
- Docentes: `WHERE requestedByUserId = user.id`
- Admin/PIP: `WHERE institutionId = inst.id` (sin filtro adicional)

### 2. Joins Complejos en GET
- loans → staff (para nombre)
- loans → loanResources → resources → categories
- Resolución de nombres: grades, sections, curricularAreas (batch query con `inArray`)
- Fallback staff → user (si staffId es null)

### 3. Status Overdue Calculado
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);
const loanDate = new Date(loan.loanDate);
loanDate.setHours(0, 0, 0, 0);

const status = loan.status === 'active' && loanDate < today ? 'overdue' : loan.status;
```

### 4. Validación de Rol en Approve/Reject
```typescript
if (user?.role === 'docente') {
  throw new ForbiddenException('Solo los administradores pueden aprobar/rechazar préstamos');
}
```

### 5. Actualización Masiva de Recursos
- Usar `updateManyStatus(institutionId, resourceIds, status)` del repositorio de Resources
- Batch update para eficiencia

### 6. Actualización Individual por Decisión
- En RETURN: Si `resourceStatusDecisions[id]` es 'mantenimiento' o 'baja', actualizar individualmente
- Agrupar recursos 'disponible' para batch update

### 7. Transacciones en Save
- INSERT loan + INSERT loanResources en transacción
- Usar `db.transaction()`

---

## 📝 Archivos a Crear

### Esquemas Zod (1 archivo)
- `lib/validations/schemas/loans.ts`
  - createLoanSchema
  - returnLoanSchema (con JSON complejos)
  - loansQuerySchema

### Route Handlers (5 archivos)
- `app/api/loans/route.ts` (GET, POST)
- `app/api/loans/[id]/approve/route.ts` (PATCH)
- `app/api/loans/[id]/reject/route.ts` (PATCH)
- `app/api/loans/[id]/return/route.ts` (PATCH)

### Helpers (opcional, si es necesario)
- Reutilizar `updateManyStatus` de Resources (ya existe en el repositorio)

**Total:** 6 archivos

---

## ⚠️ Validaciones Importantes

1. **Recursos disponibles**: En CREATE, validar que todos existan y estén `status='disponible'`
2. **Rol docente**: En APPROVE/REJECT, validar que NO sea docente
3. **Status active**: En RETURN, validar que `status='active'`
4. **Préstamo existe**: En todas las operaciones de actualización
5. **Multi-tenancy**: Siempre filtrar por institutionId
6. **resourceIds no vacío**: En CREATE, validar que haya al menos 1 recurso

---

## 🧪 Testing Crítico

1. ✅ Docente crea préstamo → approvalStatus='pending', recursos='prestado'
2. ✅ Admin crea préstamo → approvalStatus='approved', recursos='prestado'
3. ✅ Admin aprueba pending → approvalStatus='approved'
4. ✅ Admin rechaza pending → approvalStatus='rejected', recursos='disponible'
5. ✅ Return con damageReports → JSON guardado correctamente
6. ✅ Return con resourceStatusDecisions → recursos actualizados según decisión
7. ✅ Return sin recibir todos → recursos no recibidos quedan 'prestado'
8. ✅ GET con docente → solo ve sus préstamos
9. ✅ GET con admin → ve todos los préstamos
10. ✅ Status overdue calculado correctamente

---

## 📚 Referencias

- Controller: `apps/api/src/infrastructure/http/controllers/loans.controller.ts`
- Repository: `apps/api/src/infrastructure/persistence/drizzle/repositories/drizzle-loan.repository.ts`
- Entity: `apps/api/src/core/domain/entities/loan.entity.ts`
- Commands: `apps/api/src/application/use-cases/loans/commands/`
- Queries: `apps/api/src/application/use-cases/loans/queries/`
