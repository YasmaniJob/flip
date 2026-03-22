import { z } from 'zod';

export const createCurricularAreaSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  levels: z.array(z.enum(['primaria', 'secundaria'])).optional(),
  isStandard: z.boolean().default(false).optional(),
});

export const updateCurricularAreaSchema = z.object({
  name: z.string().min(1).optional(),
  levels: z.array(z.enum(['primaria', 'secundaria'])).optional(),
  active: z.boolean().optional(),
});

export const curricularAreaQuerySchema = z.object({
  level: z.enum(['primaria', 'secundaria']).optional(),
  active: z.enum(['true', 'false']).optional(),
});

export const seedStandardAreasSchema = z.object({
  selectedAreas: z.array(z.string()).optional(),
});

export type CreateCurricularAreaInput = z.infer<typeof createCurricularAreaSchema>;
export type UpdateCurricularAreaInput = z.infer<typeof updateCurricularAreaSchema>;
export type CurricularAreaQuery = z.infer<typeof curricularAreaQuerySchema>;
export type SeedStandardAreasInput = z.infer<typeof seedStandardAreasSchema>;
