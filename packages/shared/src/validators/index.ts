import { z } from 'zod';

// ============================================
// AUTH VALIDATORS
// ============================================
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    institutionName: z.string().min(2, 'Nombre de institución requerido'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// RESOURCE VALIDATORS
// ============================================
import { RESOURCE_STATUS, RESOURCE_CONDITION } from '../constants';

const resourceStatusValues = Object.values(RESOURCE_STATUS) as [string, ...string[]];
const resourceConditionValues = Object.values(RESOURCE_CONDITION) as [string, ...string[]];

export const createResourceSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    categoryId: z.string().optional(),
    templateId: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    status: z.enum(resourceStatusValues).default('disponible'),
    condition: z.enum(resourceConditionValues).default('bueno'),
    stock: z.number().min(0).default(1),
    notes: z.string().optional(),
    maintenanceProgress: z.number().min(0).max(100).optional().nullable(),
    maintenanceState: z.object({
        completedDamageIds: z.array(z.string()),
        completedSuggestionIds: z.array(z.string())
    }).optional().nullable(),
});

export const updateResourceSchema = createResourceSchema.partial();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

// ============================================
// STAFF VALIDATORS
// ============================================
export const createStaffSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    dni: z.string().optional().refine(
        (val) => !val || val === '' || /^\d{8}$/.test(val),
        { message: 'El DNI debe tener 8 números' }
    ),
    email: z.string().optional().refine(
        (val) => !val || val === '' || z.string().email().safeParse(val).success,
        { message: 'Email inválido' }
    ),
    phone: z.string().optional(),
    area: z.string().optional(),
    role: z.enum(['docente', 'pip', 'admin', 'superadmin']).default('docente'),
});

export const updateStaffSchema = createStaffSchema.partial();

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ============================================
// LOAN VALIDATORS
// ============================================
export const createLoanSchema = z.object({
    staffId: z.string().min(1, 'Selecciona un responsable'),
    resourceIds: z.array(z.string()).min(1, 'Selecciona al menos un recurso'),
    purpose: z.string().optional(),
    purposeDetails: z.object({
        area: z.string().optional(),
        grade: z.string().optional(),
        section: z.string().optional(),
        activityName: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;

// ============================================
// CATEGORY VALIDATORS
// ============================================
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    icon: z.string().optional(),
    color: z.string().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// ============================================
// RESERVATION VALIDATORS
// ============================================
export const createReservationSchema = z.object({
    resourceId: z.string().min(1, 'Recurso requerido'),
    staffId: z.string().min(1, 'Responsable requerido'),
    reservationDate: z.coerce.date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    purpose: z.string().optional(),
    area: z.string().optional(),
    grade: z.string().optional(),
    section: z.string().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

// ============================================
// PEDAGOGICAL HOURS VALIDATORS
// ============================================
export const createPedagogicalHourSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    sortOrder: z.number().optional(),
    isBreak: z.boolean().optional(),
});

export const updatePedagogicalHourSchema = createPedagogicalHourSchema.partial();
export type CreatePedagogicalHourInput = z.infer<typeof createPedagogicalHourSchema>;
export type UpdatePedagogicalHourInput = z.infer<typeof updatePedagogicalHourSchema>;

// ============================================
// GRADES VALIDATORS
// ============================================
export const createGradeSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    level: z.enum(['primaria', 'secundaria']),
    sortOrder: z.number().optional(),
});

export const updateGradeSchema = createGradeSchema.partial();
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;

// ============================================
// SECTIONS VALIDATORS
// ============================================
export const createSectionSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    gradeId: z.string().min(1, 'Grado requerido'),
    studentCount: z.number().min(0).optional(),
});

export const updateSectionSchema = createSectionSchema.partial();
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

// ============================================
// CURRICULAR AREAS VALIDATORS
// ============================================
export const createCurricularAreaSchema = z.object({
    name: z.string().min(1, 'Nombre requerido'),
    levels: z.array(z.enum(['primaria', 'secundaria'])).optional(),
});

export const updateCurricularAreaSchema = createCurricularAreaSchema.partial();
export type CreateCurricularAreaInput = z.infer<typeof createCurricularAreaSchema>;
export type UpdateCurricularAreaInput = z.infer<typeof updateCurricularAreaSchema>;
