// ============================================
// ROLES — single source of truth for all roles
// ============================================
export const USER_ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    PIP: 'pip',
    DOCENTE: 'docente',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** @deprecated Use USER_ROLES instead */
export const STAFF_ROLES = USER_ROLES;

// ============================================
// RESOURCE STATUS
// ============================================
export const RESOURCE_STATUS = {
    DISPONIBLE: 'disponible',
    PRESTADO: 'prestado',
    MANTENIMIENTO: 'mantenimiento',
    BAJA: 'baja',
} as const;

export type ResourceStatus = (typeof RESOURCE_STATUS)[keyof typeof RESOURCE_STATUS];

export const RESOURCE_STATUS_OPTIONS = [
    { value: RESOURCE_STATUS.DISPONIBLE, label: 'Disponible', color: 'green' },
    { value: RESOURCE_STATUS.PRESTADO, label: 'Prestado', color: 'blue' },
    { value: RESOURCE_STATUS.MANTENIMIENTO, label: 'Mantenimiento', color: 'yellow' },
    { value: RESOURCE_STATUS.BAJA, label: 'Baja', color: 'red' },
] as const;

// ============================================
// RESOURCE CONDITION
// ============================================
export const RESOURCE_CONDITION = {
    NUEVO: 'nuevo',
    BUENO: 'bueno',
    REGULAR: 'regular',
    MALO: 'malo',
} as const;

export type ResourceCondition = (typeof RESOURCE_CONDITION)[keyof typeof RESOURCE_CONDITION];

export const RESOURCE_CONDITION_OPTIONS = [
    { value: RESOURCE_CONDITION.NUEVO, label: 'Nuevo', stars: 4 },
    { value: RESOURCE_CONDITION.BUENO, label: 'Bueno', stars: 3 },
    { value: RESOURCE_CONDITION.REGULAR, label: 'Regular', stars: 2 },
    { value: RESOURCE_CONDITION.MALO, label: 'Malo', stars: 1 },
] as const;

// ============================================
// LOAN STATUS
// ============================================
export const LOAN_STATUS = {
    ACTIVE: 'active',
    RETURNED: 'returned',
    PENDING: 'pending',
} as const;

// ============================================
// SUBSCRIPTION
// ============================================
export const SUBSCRIPTION_STATUS = {
    TRIAL: 'trial',
    ACTIVE: 'active',
    EXPIRED: 'expired',
} as const;

export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
} as const;

export const DEFAULT_TRIAL_DAYS = parseInt(process.env.DEFAULT_TRIAL_DAYS || '15', 10);

// ============================================
// EDUCATION LEVELS
// ============================================
export const EDUCATION_LEVELS = {
    PRIMARIA: 'primaria',
    SECUNDARIA: 'secundaria',
} as const;

// ============================================
// PAGINATION
// ============================================
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
