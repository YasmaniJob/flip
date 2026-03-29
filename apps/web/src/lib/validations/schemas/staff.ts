import { z } from 'zod';

// Create staff member
export const createStaffSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  dni: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  area: z.string().optional(),
  role: z.string().default('docente'),
});

// Update staff member
export const updateStaffSchema = createStaffSchema.partial();

// Bulk create staff
export const bulkCreateStaffSchema = z.object({
  staff: z.array(createStaffSchema),
});

// Query params for listing staff
export const staffQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(10),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  include_admins: z.string().optional(), // 'true' | 'false'
  exclude_reservation_id: z.string().optional(),
});

// Query params for recurrent staff
export const recurrentStaffQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(6),
});

// Infer types
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type BulkCreateStaffInput = z.infer<typeof bulkCreateStaffSchema>;
export type StaffQueryInput = z.infer<typeof staffQuerySchema>;
export type RecurrentStaffQueryInput = z.infer<typeof recurrentStaffQuerySchema>;
