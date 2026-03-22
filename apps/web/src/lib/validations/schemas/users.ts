import { z } from 'zod';

// Toggle SuperAdmin status
export const toggleSuperAdminSchema = z.object({
  enabled: z.boolean(),
});

// Update user name
export const updateNameSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

// Change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

// Update user settings (flexible JSON)
export const updateSettingsSchema = z.record(z.any());

// Query params for listing users
export const usersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(10),
});

// Infer types
export type ToggleSuperAdminInput = z.infer<typeof toggleSuperAdminSchema>;
export type UpdateNameInput = z.infer<typeof updateNameSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UsersQueryInput = z.infer<typeof usersQuerySchema>;
