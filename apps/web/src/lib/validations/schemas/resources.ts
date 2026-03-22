import { z } from 'zod';

// Resource status enum
export const resourceStatusEnum = z.enum([
  'disponible',
  'prestado',
  'mantenimiento',
  'baja',
]);

// Resource condition enum
export const resourceConditionEnum = z.enum(['bueno', 'regular', 'malo']);

// Create resource
export const createResourceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  categoryId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: resourceConditionEnum.optional(),
  status: resourceStatusEnum.optional(),
  notes: z.string().optional(),
  stock: z.number().int().min(1).optional().default(1),
});

// Update resource (permite null en maintenanceState)
export const updateResourceSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: resourceConditionEnum.optional(),
  status: resourceStatusEnum.optional(),
  notes: z.string().optional(),
  stock: z.number().int().min(1).optional(),
  maintenanceProgress: z.number().int().min(0).max(100).optional(),
  // CRÍTICO: maintenanceState puede ser null (limpia el estado) o un objeto
  maintenanceState: z
    .union([z.record(z.any()), z.null()])
    .optional(),
});

// Batch create resources
export const batchCreateResourceSchema = z.object({
  resource: createResourceSchema,
  quantity: z.number().int().min(1).max(100, 'La cantidad debe estar entre 1 y 100'),
  items: z
    .array(
      z.object({
        serialNumber: z.string().optional(),
        condition: resourceConditionEnum.optional(),
        status: resourceStatusEnum.optional(),
      })
    )
    .optional(),
});

// Query params for listing resources
export const resourcesQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: resourceStatusEnum.optional(),
  condition: resourceConditionEnum.optional(),
});

// Infer types
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type BatchCreateResourceInput = z.infer<typeof batchCreateResourceSchema>;
export type ResourcesQueryInput = z.infer<typeof resourcesQuerySchema>;
