# Desacoplar Reuniones de Reservaciones

## Contexto

Actualmente, cuando se crea una reserva tipo "taller" (workshop), el backend automáticamente crea una entidad `Meeting` y la vincula mediante un FK `meetingId` en `classroomReservations`. Esto causa:

1. **Contaminación de datos:** Los talleres aparecen en la lista de Reuniones.
2. **Dependencia cruzada:** La UI de Reservaciones importa `AttendanceSheet` del módulo Meetings.
3. **Incapacidad funcional:** Las tarjetas de Reuniones no podían gestionar sus propios acuerdos/tareas.

**Decisión del usuario:** Reuniones y Reservaciones son módulos 100% independientes. Cada uno necesita su propio sistema de asistencia + acuerdos/tareas.

---

## Enfoque Propuesto: Tablas Nuevas + Componentes Separados

### Base de Datos

**Nuevas tablas:**

```sql
-- Asistencia por persona para talleres (workshops)
reservation_attendance (
  id TEXT PK,
  reservation_id TEXT FK → classroom_reservations.id,
  staff_id TEXT FK → staff.id,
  status TEXT DEFAULT 'presente',  -- presente | ausente | tardanza
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Tareas/acuerdos para reservaciones (talleres)
reservation_tasks (
  id TEXT PK,
  reservation_id TEXT FK → classroom_reservations.id,
  description TEXT NOT NULL,
  assigned_staff_id TEXT FK → staff.id,
  status TEXT DEFAULT 'pending',  -- pending | completed
  due_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Cambios en tablas existentes:**
- **Eliminar** `meeting_id` FK de `classroom_reservations`
- **Eliminar** `meeting_idx` index de `classroom_reservations`

### Backend (API)

| Capa | Archivo | Cambio |
|------|---------|--------|
| Schema | `schema.ts` | +2 tablas, -meetingId FK, +relaciones |
| Entity | `classroom-reservation.entity.ts` | -meetingId prop |
| Command | `create-reservation.command.ts` | -lógica de crear Meeting para workshops |
| Repository | `drizzle-reservation.repository.ts` | +CRUD para attendance y tasks |
| Controller | `classroom-reservations.controller.ts` | +endpoints para attendance y tasks |
| Port | `reservation.repository.ts` | +métodos para attendance y tasks |

**Nuevos endpoints:**
- `POST /classroom-reservations/:id/attendance` — Agregar asistente
- `PUT /classroom-reservations/:id/attendance/bulk` — Actualizar asistencia masiva
- `DELETE /classroom-reservations/attendance/:id` — Quitar asistente
- `POST /classroom-reservations/:id/tasks` — Crear tarea
- `PUT /classroom-reservations/tasks/:id` — Actualizar tarea
- `DELETE /classroom-reservations/tasks/:id` — Eliminar tarea

### Frontend

| Componente | Cambio |
|------------|--------|
| `reservaciones-client.tsx` | Reemplazar `AttendanceSheet` (meetings) → nuevo `WorkshopDetailSheet` |
| `WorkshopDetailSheet` (NUEVO) | Panel lateral con tabs: Asistencia + Acuerdos (propio de reservaciones) |
| `reservations.api.ts` | +endpoints para attendance y tasks de reservaciones |
| `use-reservations.ts` | +hooks para attendance y tasks |
| `reuniones-client.tsx` | Sin cambios (ya tiene AttendanceSheet integrado) |
| `reservation-dialog.tsx` | -lógica de title para workshops (ya no crea meeting) |

### Migración de Datos

> [!WARNING]
> Las reuniones existentes creadas automáticamente por talleres quedarán huérfanas. Se recomienda una migración que:
> 1. Copie la asistencia de `meeting_attendance` → `reservation_attendance` para reservaciones con `meetingId`
> 2. Copie las tareas de `meeting_tasks` → `reservation_tasks` para esas mismas reuniones
> 3. Elimine las reuniones huérfanas tipo 'taller'

---

## Verificación

- [ ] Crear una reserva tipo taller → NO debe crear Meeting
- [ ] Clicar taller en Reservaciones → abre `WorkshopDetailSheet` con Asistencia + Acuerdos
- [ ] Gestionar asistencia en taller (agregar, cambiar estado, eliminar)
- [ ] Gestionar acuerdos/tareas en taller (crear, completar, eliminar)
- [ ] Reuniones siguen funcionando independientemente
- [ ] No quedan imports cruzados entre módulos
