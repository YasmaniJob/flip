import { z } from 'zod';
import { flexibleDateSchema, optionalIsoDateTimeSchema, optionalSimpleDateSchema } from '../date-schemas';

// Reservation type enum
export const reservationTypeEnum = z.enum(['class', 'workshop']);

// Reservation status enum
export const reservationStatusEnum = z.enum(['active', 'cancelled']);

// Attendance status enum
export const attendanceStatusEnum = z.enum(['presente', 'ausente', 'tardanza']);

// Task status enum
export const taskStatusEnum = z.enum(['pending', 'completed']);

// Slot schema (for creating reservation)
export const slotSchema = z.object({
  pedagogicalHourId: z.string().min(1, 'ID de hora pedagógica inválido'),
  date: flexibleDateSchema,
});

// Create reservation
export const createReservationSchema = z.object({
  staffId: z.string().min(1, 'ID de staff inválido'),
  classroomId: z.string().min(1, 'ID de aula inválido').optional(),
  slots: z.array(slotSchema).min(1, 'Debe incluir al menos un slot'),
  gradeId: z.string().optional(),
  sectionId: z.string().optional(),
  curricularAreaId: z.string().optional(),
  purpose: z.string().optional(),
  type: reservationTypeEnum.optional().default('class'),
  title: z.string().optional(),
});

// Query params for GET /classroom-reservations
export const reservationsQuerySchema = z.object({
  startDate: optionalSimpleDateSchema,
  endDate: optionalSimpleDateSchema,
  classroomId: z.string().min(1).optional(),
  shift: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Reschedule single slot
export const rescheduleSlotSchema = z.object({
  newDate: flexibleDateSchema,
  newPedagogicalHourId: z.string().min(1, 'ID de hora pedagógica inválido'),
});

// Reschedule block (all slots)
export const rescheduleBlockSchema = z.object({
  slots: z.array(slotSchema).min(1, 'Debe incluir al menos un slot'),
});

// Mark attendance on slot
export const markAttendanceSchema = z.object({
  attended: z.boolean(),
});

// Create attendance (workshop)
export const createAttendanceSchema = z.object({
  staffId: z.string().min(1, 'ID de staff inválido').optional(),
  staffIds: z.array(z.string()).optional(),
}).refine(data => data.staffId || (data.staffIds && data.staffIds.length > 0), {
  message: "Debe proporcionar al menos un ID de personal",
  path: ["staffId"]
});

// Bulk update attendance
export const bulkUpdateAttendanceSchema = z.object({
  updates: z.array(
    z.object({
      attendanceId: z.string().min(1, 'ID de asistencia inválido'),
      status: attendanceStatusEnum,
    })
  ).min(1, 'Debe incluir al menos una actualización'),
});

// Create task
export const createTaskSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  assignedStaffId: z.string().optional(),
  dueDate: optionalIsoDateTimeSchema,
  status: taskStatusEnum.optional().default('pending'),
});

// Update task
export const updateTaskSchema = z.object({
  description: z.string().min(1).optional(),
  assignedStaffId: z.string().optional(),
  dueDate: optionalIsoDateTimeSchema,
  status: taskStatusEnum.optional(),
});

// Infer types
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationsQueryInput = z.infer<typeof reservationsQuerySchema>;
export type RescheduleSlotInput = z.infer<typeof rescheduleSlotSchema>;
export type RescheduleBlockInput = z.infer<typeof rescheduleBlockSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type BulkUpdateAttendanceInput = z.infer<typeof bulkUpdateAttendanceSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
