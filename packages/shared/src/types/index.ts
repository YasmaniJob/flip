// ============================================
// ROLES — imported from constants (single source of truth)
// ============================================
import type { UserRole } from '../constants';
export { USER_ROLES as ROLES, USER_ROLES } from '../constants';
export type { UserRole } from '../constants';

// ============================================
// USER
// ============================================
export interface User {
    id: string;
    institutionId: string;
    name: string;
    email?: string;
    dni?: string;
    role: UserRole;
    isSuperAdmin: boolean;
    createdAt: Date;
}

// ============================================
// INSTITUTION (Institución Educativa)
// ============================================
export interface Institution {
    id: string;
    name: string;
    slug: string;
    plan: 'free' | 'pro' | 'enterprise';
    isPlatformOwner: boolean;
    subscriptionStatus: 'trial' | 'active' | 'expired';
    trialEndsAt?: Date;
    subscriptionEndsAt?: Date;
    settings?: InstitutionSettings;
    createdAt: Date;
}

export interface InstitutionSettings {
    logoUrl?: string;
    primaryColor?: string;
    schoolName?: string;
    educationLevels?: ('primaria' | 'secundaria')[];
}

// ============================================
// CATEGORY
// ============================================
export interface Category {
    id: string;
    institutionId: string;
    name: string;
    icon?: string;
    color?: string;
}

// ============================================
// RESOURCE (Inventory Item)
// ============================================
export interface Resource {
    id: string;
    institutionId: string;
    categoryId?: string;
    name: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    status: ResourceStatus;
    condition: ResourceCondition;
    stock: number;
    attributes?: Record<string, string>;
    notes?: string;
    createdAt: Date;
}

// Import types from constants to avoid duplication
import type { ResourceStatus, ResourceCondition } from '../constants';
export type { ResourceStatus, ResourceCondition };

// ============================================
// STAFF (Borrowers)
// ============================================
export interface Staff {
    id: string;
    institutionId: string;
    name: string;
    dni?: string;
    email?: string;
    phone?: string;
    area?: string;
    role: UserRole;
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// LOAN
// ============================================
export interface Loan {
    id: string;
    institutionId: string;
    staffId?: string;
    status: LoanStatus;
    purpose?: string;
    purposeDetails?: LoanPurposeDetails;
    loanDate: Date;
    returnDate?: Date;
    notes?: string;
}

export type LoanStatus = 'active' | 'returned' | 'pending';

export interface LoanPurposeDetails {
    area?: string;
    grade?: string;
    section?: string;
    activityName?: string;
}

// ============================================
// RESERVATION
// ============================================
export interface Reservation {
    id: string;
    institutionId: string;
    resourceId: string;
    staffId: string;
    reservationDate: Date;
    startTime: string;
    endTime: string;
    purpose?: string;
    area?: string;
    grade?: string;
    section?: string;
    status: 'active' | 'completed' | 'cancelled';
    createdBy: string;
    createdAt: Date;
}

// ============================================
// CURRICULAR AREA
// ============================================
export interface CurricularArea {
    id: string;
    institutionId: string;
    name: string;
    levels?: ('primaria' | 'secundaria')[];
    isStandard: boolean;
    active: boolean;
    createdAt: Date;
}

// ============================================
// GRADE & SECTION
// ============================================
export interface Grade {
    id: string;
    institutionId: string;
    name: string;
    level: 'primaria' | 'secundaria';
    sortOrder: number;
    createdAt: Date;
}

export interface Section {
    id: string;
    institutionId: string;
    name: string;
    gradeId: string;
    areaId?: string;
    studentCount?: number;
    createdAt: Date;
}

// ============================================
// PEDAGOGICAL HOURS
// ============================================
export interface PedagogicalHour {
    id: string;
    institutionId: string;
    name: string;
    startTime: string;
    endTime: string;
    sortOrder: number;
    active: boolean;
    createdAt: Date;
}

