import { z } from 'zod';

// ============================================
// INCIDENT MANAGEMENT - VALIDATION SCHEMAS
// ============================================

// Core Enums
export const incidentTypeSchema = z.enum(['recursos', 'infraestructura', 'servicios', 'seguridad', 'otros']);
export const incidentPrioritySchema = z.enum(['baja', 'media', 'alta', 'critica']);
export const incidentStatusSchema = z.enum(['reportada', 'en_revision', 'en_progreso', 'resuelta', 'cerrada']);

// Create Incident
export const createIncidentSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(2000, 'La descripción no puede exceder 2000 caracteres'),
  type: incidentTypeSchema,
  priority: incidentPrioritySchema,
  resourceId: z.string().uuid().optional(),
  location: z.string().max(200).optional(),
}).refine(
  (data) => {
    // If type is 'recursos', resourceId is required
    if (data.type === 'recursos') {
      return !!data.resourceId;
    }
    return true;
  },
  {
    message: "El recurso es obligatorio cuando el tipo es 'recursos/equipos'",
    path: ['resourceId'],
  }
);

// Update Incident
export const updateIncidentSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  type: incidentTypeSchema.optional(),
  priority: incidentPrioritySchema.optional(),
  resourceId: z.string().uuid().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
});

// Change Status
export const changeStatusSchema = z.object({
  status: incidentStatusSchema,
  resolutionComment: z.string().min(10, 'El comentario de resolución debe tener al menos 10 caracteres').optional(),
}).refine(
  (data) => {
    // When status changes to 'resuelta', resolutionComment is required
    if (data.status === 'resuelta') {
      return !!data.resolutionComment && data.resolutionComment.length >= 10;
    }
    return true;
  },
  {
    message: "El comentario de resolución es obligatorio al marcar como resuelta",
    path: ['resolutionComment'],
  }
);

// Change Priority
export const changePrioritySchema = z.object({
  priority: incidentPrioritySchema,
});

// Assign Incident
export const assignIncidentSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

// Create Comment
export const createCommentSchema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío').max(2000, 'El comentario no puede exceder 2000 caracteres'),
});

// Update Comment
export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Bulk Update
export const bulkUpdateSchema = z.object({
  incidentIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una incidencia').max(50, 'No puede actualizar más de 50 incidencias a la vez'),
  action: z.enum(['status', 'priority', 'assign']),
  value: z.union([
    incidentStatusSchema,
    incidentPrioritySchema,
    z.string().uuid(),
    z.null(),
  ]),
});

// Create Template
export const createTemplateSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  type: incidentTypeSchema,
  suggestedPriority: incidentPrioritySchema,
  titleTemplate: z.string().min(5).max(200),
  descriptionTemplate: z.string().min(10).max(2000),
});

// Update Template
export const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  type: incidentTypeSchema.optional(),
  suggestedPriority: incidentPrioritySchema.optional(),
  titleTemplate: z.string().min(5).max(200).optional(),
  descriptionTemplate: z.string().min(10).max(2000).optional(),
  isActive: z.boolean().optional(),
});

// List Incidents Query
export const listIncidentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.union([incidentStatusSchema, z.array(incidentStatusSchema)]).optional(),
  priority: z.union([incidentPrioritySchema, z.array(incidentPrioritySchema)]).optional(),
  type: z.union([incidentTypeSchema, z.array(incidentTypeSchema)]).optional(),
  assigneeId: z.string().uuid().optional(),
  reporterId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  isRecurrent: z.coerce.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// File Upload Validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'El archivo no puede exceder 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Solo se permiten archivos JPEG, PNG o WebP'
    ),
});

// Export types
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
export type ChangePriorityInput = z.infer<typeof changePrioritySchema>;
export type AssignIncidentInput = z.infer<typeof assignIncidentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ListIncidentsQueryInput = z.infer<typeof listIncidentsQuerySchema>;
