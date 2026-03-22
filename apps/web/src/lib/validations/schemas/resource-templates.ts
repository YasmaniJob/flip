import { z } from 'zod';

// Create resource template
export const createResourceTemplateSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  icon: z.string().optional(),
  defaultBrand: z.string().optional(),
  defaultModel: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
});

// Update resource template
export const updateResourceTemplateSchema = createResourceTemplateSchema.partial();

// Query params for listing templates
export const resourceTemplatesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(10),
  categoryId: z.string().optional(),
});

// Infer types
export type CreateResourceTemplateInput = z.infer<typeof createResourceTemplateSchema>;
export type UpdateResourceTemplateInput = z.infer<typeof updateResourceTemplateSchema>;
export type ResourceTemplatesQueryInput = z.infer<typeof resourceTemplatesQuerySchema>;
