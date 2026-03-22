# 📋 Análisis Completo: Módulo Reservations (Classroom Reservations)

**Fecha:** 21 de marzo de 2026  
**Complejidad:** 🔴 Alta (Slots individuales, conflictos, rescheduling, attendance, tasks)

---

## 🎯 Endpoints del Módulo

### RESERVATIONS (Core)

#### 1. GET /api/classroom-reservations
**Método:** GET  
**Ruta:** `/classroom-reservations`  
**Roles:** Autenticado (AuthGuard)  
**Query params:**
```typescript
{
  startDate?: string;    // ISO date
  endDate?: string;      // ISO date
  classroomId?: string;  // Filter by classroom
  shift?: string;        // Filter by shift
}
```

#### 2. GET /api/classroom-reservations/my-today
**Método:** GET  
**Ruta:** `/classroom-reservations/my-today`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Retorna slots del usuario actual para hoy

#### 3. POST /api/classroom-reservations
**Método:** POST  
**Ruta:** `/classroom-reservations`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  staffId: string;
  classroomId?: string;
  slots: Array<{
    pedagogicalHourId: string;
    date: string;  // ISO date
  }>;
  gradeId?: string;
  sectionId?: string;
  curricularAreaId?: string;
  purpose?: string;
  type?: 'class' | 'workshop';
  title?: string;  // For workshops
}
```
**Lógica especial:**
- Validar conflictos: unique constraint (classroomId + date + pedagogicalHourId)
- Crear reservation + múltiples slots en transacción
- Cada slot es un registro separado en `reservation_slots`

#### 4. PUT /api/classroom-reservations/:id/cancel
**Método:** PUT  
**Ruta:** `/classroom-reservations/:id/cancel`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:**
- Marca reservation como `status='cancelled'`
- Marca `cancelledAt=now()`
- Validación de permisos: solo el creador o admin puede cancelar

---

### SLOTS (Individual slot management)

#### 5. DELETE /api/classroom-reservations/slots/:slotId
**Método:** DELETE  
**Ruta:** `/classroom-reservations/slots/:slotId`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:**
- Elimina un slot individual de una reserva
- Validación de permisos: solo el creador o admin

#### 6. PUT /api/classroom-reservations/slots/:slotId/attendance
**Método:** PUT  
**Ruta:** `/classroom-reservations/slots/:slotId/attendance`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  attended: boolean;
}
```
**Lógica:**
- Marca asistencia en un slot específico
- Actualiza `attended=true/false`, `attendedAt=now()`

#### 7. PUT /api/classroom-reservations/slots/:slotId/reschedule
**Método:** PUT  
**Ruta:** `/classroom-reservations/slots/:slotId/reschedule`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  newDate: string;              // ISO date
  newPedagogicalHourId: string;
}
```
**Lógica:**
- Actualiza fecha y/o hora de un slot individual
- Validar conflictos en la nueva fecha/hora
- Validación de permisos: solo el creador o admin

#### 8. PUT /api/classroom-reservations/:id/reschedule-block
**Método:** PUT  
**Ruta:** `/classroom-reservations/:id/reschedule-block`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  slots: Array<{
    date: string;
    pedagogicalHourId: string;
  }>;
}
```
**Lógica:**
- Reprograma todos los slots de una reserva
- Elimina slots antiguos, crea nuevos
- Validar conflictos para todos los nuevos slots
- Transacción: DELETE old slots + INSERT new slots

---

### ATTENDANCE (Per-person for workshops)

#### 9. GET /api/classroom-reservations/:id/attendance
**Método:** GET  
**Ruta:** `/classroom-reservations/:id/attendance`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Lista asistentes de una reserva (workshop)

#### 10. POST /api/classroom-reservations/:id/attendance
**Método:** POST  
**Ruta:** `/classroom-reservations/:id/attendance`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  staffId: string;
}
```
**Lógica:** Agrega un asistente a la reserva

#### 11. PUT /api/classroom-reservations/:id/attendance/bulk
**Método:** PUT  
**Ruta:** `/classroom-reservations/:id/attendance/bulk`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  updates: Array<{
    attendanceId: string;
    status: string;  // 'presente' | 'ausente' | 'tardanza'
  }>;
}
```
**Lógica:** Actualiza status de múltiples asistentes

#### 12. DELETE /api/classroom-reservations/attendance/:attendanceId
**Método:** DELETE  
**Ruta:** `/classroom-reservations/attendance/:attendanceId`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Elimina un asistente de la reserva

---

### TASKS (Agreements for workshops)

#### 13. GET /api/classroom-reservations/:id/tasks
**Método:** GET  
**Ruta:** `/classroom-reservations/:id/tasks`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Lista tareas/acuerdos de una reserva

#### 14. POST /api/classroom-reservations/:id/tasks
**Método:** POST  
**Ruta:** `/classroom-reservations/:id/tasks`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  description: string;
  assignedStaffId?: string;
  dueDate?: string;  // ISO date
  status?: string;   // 'pending' | 'completed'
}
```
**Lógica:** Crea una tarea/acuerdo

#### 15. PUT /api/classroom-reservations/tasks/:taskId
**Método:** PUT  
**Ruta:** `/classroom-reservations/tasks/:taskId`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  description?: string;
  status?: string;
  assignedStaffId?: string;
  dueDate?: string;
}
```
**Lógica:** Actualiza una tarea (partial update)

#### 16. DELETE /api/classroom-reservations/tasks/:taskId
**Método:** DELETE  
**Ruta:** `/classroom-reservations/tasks/:taskId`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Elimina una tarea

---

## 🔑 Puntos Críticos

### 1. Validación de Conflictos
**Unique constraint:** `(classroomId, date, pedagogicalHourId)`
- Antes de crear slots, validar que no existan conflictos
- Query: `SELECT * FROM reservation_slots WHERE classroomId=X AND date=Y AND pedagogicalHourId=Z`
- Si existe: lanzar `ValidationError('El horario ya está reservado')`

### 2. Slots Individuales
- Cada slot es un registro separado en `reservation_slots`
- Un reservation puede tener múltiples slots
- Relación: `reservation (1) → (N) slots`

### 3. Transacciones
**CREATE:**
```typescript
await db.transaction(async (tx) => {
  // INSERT reservation
  // INSERT multiple slots
});
```

**RESCHEDULE BLOCK:**
```typescript
await db.transaction(async (tx) => {
  // DELETE old slots
  // INSERT new slots (validar conflictos primero)
});
```

### 4. Validación de Permisos
- **Creador**: `reservation.staffId === user.id` o `requestedByUserId === user.id`
- **Admin/SuperAdmin**: Puede modificar cualquier reserva
- Implementar helper: `canModifyReservation(reservation, user)`

### 5. Fechas
- Normalizar fechas: `date.includes('T') ? date : date + 'T00:00:00'`
- Comparar solo fecha (sin hora): `date.setHours(0,0,0,0)`

---

## 📦 Estructura de Datos

### Reservation
```typescript
{
  id: string;
  institutionId: string;
  classroomId: string;
  staffId: string;
  gradeId?: string;
  sectionId?: string;
  curricularAreaId?: string;
  type: 'class' | 'workshop';
  title?: string;
  purpose?: string;
  status: 'active' | 'cancelled';
  createdAt: Date;
  cancelledAt?: Date;
}
```

### ReservationSlot
```typescript
{
  id: string;
  reservationId: string;
  institutionId: string;
  classroomId: string;
  pedagogicalHourId: string;
  date: Date;
  attended: boolean;
  attendedAt?: Date;
}
```

### ReservationAttendance (workshops)
```typescript
{
  id: string;
  reservationId: string;
  staffId: string;
  status: 'presente' | 'ausente' | 'tardanza';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ReservationTask (workshops)
```typescript
{
  id: string;
  reservationId: string;
  description: string;
  assignedStaffId?: string;
  status: 'pending' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📝 Archivos a Crear

### Esquemas Zod (1 archivo)
- `lib/validations/schemas/reservations.ts`
  - createReservationSchema
  - rescheduleSlotSchema
  - rescheduleBlockSchema
  - markAttendanceSchema
  - createAttendanceSchema
  - bulkUpdateAttendanceSchema
  - createTaskSchema
  - updateTaskSchema
  - reservationsQuerySchema

### Route Handlers (16 archivos)
1. `app/api/classroom-reservations/route.ts` (GET, POST)
2. `app/api/classroom-reservations/my-today/route.ts` (GET)
3. `app/api/classroom-reservations/[id]/cancel/route.ts` (PUT)
4. `app/api/classroom-reservations/[id]/reschedule-block/route.ts` (PUT)
5. `app/api/classroom-reservations/slots/[slotId]/route.ts` (DELETE)
6. `app/api/classroom-reservations/slots/[slotId]/attendance/route.ts` (PUT)
7. `app/api/classroom-reservations/slots/[slotId]/reschedule/route.ts` (PUT)
8. `app/api/classroom-reservations/[id]/attendance/route.ts` (GET, POST)
9. `app/api/classroom-reservations/[id]/attendance/bulk/route.ts` (PUT)
10. `app/api/classroom-reservations/attendance/[attendanceId]/route.ts` (DELETE)
11. `app/api/classroom-reservations/[id]/tasks/route.ts` (GET, POST)
12. `app/api/classroom-reservations/tasks/[taskId]/route.ts` (PUT, DELETE)

**Total:** 13 archivos (1 schema + 12 route handlers)

---

## ⚠️ Validaciones Importantes

1. **Conflictos de horario**: Validar antes de INSERT slots
2. **Permisos**: Solo creador o admin puede modificar
3. **Status**: Solo reservas `status='active'` pueden ser modificadas
4. **Fechas**: Normalizar formato ISO
5. **Multi-tenancy**: Siempre filtrar por institutionId
6. **Unique constraint**: Manejar error de DB si hay conflicto

---

## 🧪 Testing Crítico

1. ✅ Crear reserva con múltiples slots
2. ✅ Validar conflicto al crear slot duplicado
3. ✅ Cancelar reserva completa
4. ✅ Cancelar slot individual
5. ✅ Reprogramar slot individual
6. ✅ Reprogramar bloque completo
7. ✅ Marcar asistencia en slot
8. ✅ Agregar/eliminar asistentes (workshops)
9. ✅ Crear/actualizar/eliminar tareas
10. ✅ Validar permisos (solo creador o admin)

---

## 📚 Referencias

- Controller: `apps/api/src/infrastructure/http/controllers/classroom-reservations.controller.ts`
- Schema: `apps/web/src/lib/db/schema.ts` (classroomReservations, reservationSlots, reservationAttendance, reservationTasks)
