import { z } from 'zod';

// Onboard schema
export const onboardSchema = z.object({
  codigoModular: z.string().min(1, 'El código modular es requerido'),
  nivel: z.string().min(1, 'El nivel es requerido'),
  nombre: z.string().optional(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  isManual: z.boolean().optional(),
}).refine(
  (data) => {
    // If isManual=true, nombre is required
    if (data.isManual === true && !data.nombre) {
      return false;
    }
    return true;
  },
  {
    message: 'El nombre es requerido para creación manual',
    path: ['nombre'],
  }
);

// Search query schema
export const searchQuerySchema = z.object({
  q: z.string().optional(),
  nivel: z.string().optional(),
  departamento: z.string().optional(),
  provincia: z.string().optional(),
  distrito: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

// Update brand schema
export const updateBrandSchema = z.object({
  brandColor: z.string().optional(),
  logoUrl: z.string().optional(),
});

// Infer types
export type OnboardInput = z.infer<typeof onboardSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
