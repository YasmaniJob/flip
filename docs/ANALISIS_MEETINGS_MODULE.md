# 📋 Análisis Completo: Módulo Meetings

**Fecha:** 21 de marzo de 2026  
**Complejidad:** 🟡 Media (CRUD + Attendance + Tasks)

---

## 🎯 Endpoints del Módulo

### MEETINGS (Core - 4 endpoints)

#### 1. POST /api/meetings
**Método:** POST  
**Ruta:** `/meetings`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  title: string;
  date: string;              // ISO date
  startTime?: string;        // HH:mm
  endTime?: string;          // HH:mm
  type?: string;             // 'asistencia_tecnica' | otros
  status?: string;           // 'active' | 'cancelled' | 'completed'
  involvedActors?: string[]; // ['Director(a)', 'Docentes', ...]
  involvedAreas?: string[];  // ['Matemática', 'Comunicación', ...]
  notes?: string;
}
```

#### 2. GET /api/meetings
**Método:** GET  
**Ruta:** `/meetings`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Lista todas las reuniones de la institución

#### 3. GET /api/meetings/:id
**Método:** GET  
**Ruta:** `/meetings/:id`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Obtiene una reunión específica con relaciones

#### 4. DELETE /api/meetings/:id
**Método:** DELETE  
**Ruta:** `/meetings/:id`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Elimina una reunión

---

### ATTENDANCE (Asistencia - endpoints en repositorio)

**Nota:** Los endpoints de attendance no están en el controller, están implementados directamente en el repositorio. Necesitamos crearlos:

#### 5. GET /api/meetings/:id/attendance
**Método:** GET  
**Ruta:** `/meetings/:id/attendance`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Lista asistentes de una reunión

#### 6. POST /api/meetings/:id/attendance
**Método:** POST  
**Ruta:** `/meetings/:id/attendance`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  staffId: string;
  status?: string;  // 'presente' | 'ausente' | 'tardanza'
  notes?: string;
}
```

#### 7. PATCH /api/meetings/attendance/:attendanceId
**Método:** PATCH  
**Ruta:** `/meetings/attendance/:attendanceId`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  status?: string;
  notes?: string;
}
```

#### 8. DELETE /api/meetings/attendance/:attendanceId
**Método:** DELETE  
**Ruta:** `/meetings/attendance/:attendanceId`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Elimina un registro de asistencia

---

### TASKS (Acuerdos - 3 endpoints)

#### 9. POST /api/meetings/:id/tasks
**Método:** POST  
**Ruta:** `/meetings/:id/tasks`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  description: string;
  assignedStaffId?: string;
  dueDate?: string;         // ISO date
  status?: string;          // 'pending' | 'completed'
}
```

#### 10. PATCH /api/meetings/tasks/:taskId
**Método:** PATCH  
**Ruta:** `/meetings/tasks/:taskId`  
**Roles:** Autenticado (AuthGuard)  
**Body:**
```typescript
{
  description?: string;
  assignedStaffId?: string;
  dueDate?: string;
  status?: string;
}
```

#### 11. DELETE /api/meetings/tasks/:taskId
**Método:** DELETE  
**Ruta:** `/meetings/tasks/:taskId`  
**Roles:** Autenticado (AuthGuard)  
**Lógica:** Elimina una tarea

---

## 📦 Estructura de Datos

### Meeting
```typescript
{
  id: string;
  institutionId: string;
  title: string;
  date: Date;
  startTime?: string;        // HH:mm
  endTime?: string;          // HH:mm
  type: string;              // default 'asistencia_tecnica'
  status: string;            // default 'active'
  involvedActors: string[];  // JSON array
  involvedAreas: string[];   // JSON array
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### MeetingAttendance
```typescript
{
  id: string;
  meetingId: string;
  staffId: string;
  status: string;            // 'presente' | 'ausente' | 'tardanza'
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### MeetingTask
```typescript
{
  id: string;
  meetingId: string;
  description: string;
  assignedStaffId?: string;
  status: string;            // 'pending' | 'completed'
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔑 Puntos Críticos

### 1. JSON Arrays
- `involvedActors`: Array de strings (roles/actores)
- `involvedAreas`: Array de strings (áreas curriculares)
- Validar con Zod: `z.array(z.string())`

### 2. Relaciones
- Meeting (1) → (N) Attendance
- Meeting (1) → (N) Tasks
- Usar `with` en queries para incluir relaciones

### 3. Unique Constraint
- Attendance: `(meetingId, staffId)` debe ser único
- Manejar error de duplicado

### 4. Partial Updates
- Tasks: Usar `buildPartialUpdate` para updates parciales
- Attendance: Actualizar solo campos presentes

### 5. Transacciones
- No son críticas en este módulo (operaciones simples)
- Usar solo si se requiere atomicidad

---

## 📝 Archivos a Crear

### Esquemas Zod (1 archivo)
- `lib/validations/schemas/meetings.ts`
  - createMeetingSchema
  - createAttendanceSchema
  - updateAttendanceSchema
  - createTaskSchema
  - updateTaskSchema

### Route Handlers (8 archivos)
1. `app/api/meetings/route.ts` (GET, POST)
2. `app/api/meetings/[id]/route.ts` (GET, DELETE)
3. `app/api/meetings/[id]/attendance/route.ts` (GET, POST)
4. `app/api/meetings/attendance/[attendanceId]/route.ts` (PATCH, DELETE)
5. `app/api/meetings/[id]/tasks/route.ts` (POST)
6. `app/api/meetings/tasks/[taskId]/route.ts` (PATCH, DELETE)

**Total:** 7 archivos (1 schema + 6 route handlers)

---

## ⚠️ Validaciones Importantes

1. **Meeting existe**: En todas las operaciones de attendance/tasks
2. **Staff existe**: Al crear attendance o asignar task
3. **Unique attendance**: Un staff solo puede tener un registro por meeting
4. **Multi-tenancy**: Siempre filtrar por institutionId
5. **Fechas**: Validar formato ISO para date y dueDate
6. **Status válidos**: Validar con enums en Zod

---

## 🧪 Testing Crítico

1. ✅ Crear meeting con involvedActors y involvedAreas
2. ✅ Listar meetings con relaciones
3. ✅ Agregar asistentes a meeting
4. ✅ Actualizar status de asistencia
5. ✅ Crear tareas con asignación
6. ✅ Actualizar tareas (partial update)
7. ✅ Eliminar meeting (cascade a attendance y tasks)
8. ✅ Validar unique constraint en attendance

---

## 📊 Comparación con Reservations

| Aspecto | Meetings | Reservations |
|---------|----------|--------------|
| Endpoints | 11 | 16 |
| Complejidad | 🟡 Media | 🔴 Muy Alta |
| Conflictos | No | Sí (horarios) |
| Transacciones | Opcionales | Requeridas |
| Permisos | Básicos | Complejos |
| Archivos | 7 | 13 |

**Conclusión:** Meetings es significativamente más simple que Reservations.

---

## 📚 Referencias

- Controller: `apps/api/src/infrastructure/http/controllers/meetings.controller.ts`
- Schema: `apps/web/src/lib/db/schema.ts` (meetings, meetingAttendance, meetingTasks)
