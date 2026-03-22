import { z } from 'zod';

// Create category
export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// Update category
export const updateCategorySchema = createCategorySchema.partial();

// Query params for listing categories
export const categoriesQuerySchema = z.object({
  has_resources: z.string().optional(), // 'true' | 'false'
});

// Infer types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoriesQueryInput = z.infer<typeof categoriesQuerySchema>;
