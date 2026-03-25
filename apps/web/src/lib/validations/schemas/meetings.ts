import { z } from 'zod';
import { flexibleDateSchema, optionalIsoDateTimeSchema } from '../date-schemas';

// Meeting type enum
export const meetingTypeEnum = z.enum(['asistencia_tecnica', 'reunion_docentes', 'capacitacion', 'general', 'otro']);

// Meeting status enum
export const meetingStatusEnum = z.enum(['active', 'cancelled', 'completed']);

// Attendance status enum
export const attendanceStatusEnum = z.enum(['presente', 'ausente', 'tardanza']);

// Task status enum
export const taskStatusEnum = z.enum(['pending', 'completed']);

// Create meeting
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  date: flexibleDateSchema,
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)').optional(),
  type: meetingTypeEnum.optional().default('asistencia_tecnica'),
  status: meetingStatusEnum.optional().default('active'),
  involvedActors: z.array(z.string()).optional().default([]),
  involvedAreas: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

// Update meeting (partial)
export const updateMeetingSchema = createMeetingSchema.partial();

// Create attendance
export const createAttendanceSchema = z.object({
  staffId: z.string().uuid('ID de staff inválido'),
  status: attendanceStatusEnum.optional().default('presente'),
  notes: z.string().optional(),
});

// Update attendance
export const updateAttendanceSchema = z.object({
  status: attendanceStatusEnum.optional(),
  notes: z.string().optional(),
});

// Create task
export const createTaskSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  assignedStaffId: z.string().uuid().optional(),
  dueDate: optionalIsoDateTimeSchema,
  status: taskStatusEnum.optional().default('pending'),
});

// Update task
export const updateTaskSchema = z.object({
  description: z.string().min(1).optional(),
  assignedStaffId: z.string().uuid().optional(),
  dueDate: optionalIsoDateTimeSchema,
  status: taskStatusEnum.optional(),
});

// Infer types
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
