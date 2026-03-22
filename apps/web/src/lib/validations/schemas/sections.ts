import { z } from 'zod';

export const createSectionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  gradeId: z.string().min(1, 'El grado es requerido'),
  areaId: z.string().optional(),
  studentCount: z.number().int().min(0).optional(),
});

export const updateSectionSchema = createSectionSchema.partial();

export const sectionQuerySchema = z.object({
  gradeId: z.string().optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type SectionQuery = z.infer<typeof sectionQuerySchema>;
