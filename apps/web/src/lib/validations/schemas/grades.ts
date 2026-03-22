import { z } from 'zod';

export const createGradeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  level: z.enum(['primaria', 'secundaria'], {
    errorMap: () => ({ message: 'El nivel debe ser primaria o secundaria' }),
  }),
  sortOrder: z.number().int().min(0).default(0).optional(),
});

export const updateGradeSchema = createGradeSchema.partial();

export const gradeQuerySchema = z.object({
  level: z.enum(['primaria', 'secundaria']).optional(),
});

export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type GradeQuery = z.infer<typeof gradeQuerySchema>;
