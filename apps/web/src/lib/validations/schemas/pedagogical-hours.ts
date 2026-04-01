import { z } from 'zod';

// Regex para validar formato HH:mm (ej: 08:00, 14:30)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createPedagogicalHourSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  startTime: z.string().regex(timeRegex, 'Formato de hora inválido (use HH:mm)'),
  endTime: z.string().regex(timeRegex, 'Formato de hora inválido (use HH:mm)'),
  sortOrder: z.number().int().min(0).default(0).optional(),
  isBreak: z.boolean().default(false).optional(),
});

export const updatePedagogicalHourSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().regex(timeRegex, 'Formato de hora inválido (use HH:mm)').optional(),
  endTime: z.string().regex(timeRegex, 'Formato de hora inválido (use HH:mm)').optional(),
  sortOrder: z.number().int().min(0).optional(),
  isBreak: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const bulkCreatePedagogicalHourSchema = z.array(createPedagogicalHourSchema);

export type CreatePedagogicalHourInput = z.infer<typeof createPedagogicalHourSchema>;
export type UpdatePedagogicalHourInput = z.infer<typeof updatePedagogicalHourSchema>;
export type BulkCreatePedagogicalHourInput = z.infer<typeof bulkCreatePedagogicalHourSchema>;
