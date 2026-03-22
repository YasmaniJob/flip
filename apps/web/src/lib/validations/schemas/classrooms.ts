import { z } from 'zod';

export const createClassroomSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().optional(),
  isPrimary: z.boolean().default(false).optional(),
  sortOrder: z.number().int().min(0).default(0).optional(),
});

export const updateClassroomSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
