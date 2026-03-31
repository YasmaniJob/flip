/**
 * Validation Schemas for Diagnostic Module
 */

import { z } from 'zod';

// DNI validation (8 digits, not suspicious patterns)
const SUSPICIOUS_DNIS = ['00000000', '11111111', '22222222', '33333333', '44444444', '55555555', '66666666', '77777777', '88888888', '99999999', '12345678', '87654321'];

export const dniSchema = z.string()
  .regex(/^\d{8}$/, 'DNI debe tener exactamente 8 dígitos')
  .refine(dni => !SUSPICIOUS_DNIS.includes(dni), 'DNI inválido');

// Name validation (letters, spaces, accents)
export const nameSchema = z.string()
  .min(3, 'Nombre debe tener al menos 3 caracteres')
  .max(100, 'Nombre debe tener máximo 100 caracteres')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo debe contener letras y espacios');

// Email validation (no temporary email domains)
const TEMP_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'getnada.com',
  'maildrop.cc',
];

export const emailSchema = z.string()
  .email('Email inválido')
  .refine(email => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !TEMP_EMAIL_DOMAINS.includes(domain);
  }, 'No se permiten emails temporales');

// Identify request validation
export const identifyRequestSchema = z.object({
  dni: dniSchema.optional().or(z.literal('')).or(z.null()),
  name: nameSchema,
  email: emailSchema,
  userId: z.string().optional().nullable(),
});

// Save response validation
export const saveResponseRequestSchema = z.object({
  token: z.string().uuid('Token inválido'),
  questionId: z.string().min(1, 'ID de pregunta requerido'),
  score: z.number().int().min(0).max(3, 'Score debe estar entre 0 y 3'),
});

// Complete session validation
export const completeSessionRequestSchema = z.object({
  token: z.string().uuid('Token inválido'),
});

// Admin: Approve session validation
export const approveSessionRequestSchema = z.object({
  sessionId: z.string().min(1, 'ID de sesión requerido'),
});

// Admin: Update config validation
export const updateConfigRequestSchema = z.object({
  diagnosticEnabled: z.boolean().optional(),
  diagnosticRequiresApproval: z.boolean().optional(),
  diagnosticCustomMessage: z.string().max(500).optional().nullable(),
});

// Admin: Create/Update question validation
export const questionRequestSchema = z.object({
  id: z.string().optional(), // For updates
  categoryId: z.string().min(1, 'ID de categoría requerido').optional(),
  text: z.string().min(10, 'Pregunta debe tener al menos 10 caracteres').max(500, 'Pregunta debe tener máximo 500 caracteres').optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return data.categoryId || data.text || data.order !== undefined || data.isActive !== undefined;
  },
  { message: 'Al menos un campo debe ser proporcionado' }
);

export type IdentifyRequest = z.infer<typeof identifyRequestSchema>;
export type SaveResponseRequest = z.infer<typeof saveResponseRequestSchema>;
export type CompleteSessionRequest = z.infer<typeof completeSessionRequestSchema>;
export type ApproveSessionRequest = z.infer<typeof approveSessionRequestSchema>;
export type UpdateConfigRequest = z.infer<typeof updateConfigRequestSchema>;
export type QuestionRequest = z.infer<typeof questionRequestSchema>;
