import { format, parseISO, isAfter, differenceInDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// DATE FORMATTING
// ============================================
export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd/MM/yyyy', { locale: es });
};

export const formatDateTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy HH:mm", { locale: es });
};

export const formatDateLong = (date: Date | string): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
};

// ============================================
// DATE CALCULATIONS
// ============================================
export const isOverdue = (dueDate: Date): boolean => {
    return isAfter(new Date(), dueDate);
};

export const getDaysUntilDue = (dueDate: Date): number => {
    return differenceInDays(dueDate, new Date());
};

export const getDaysOverdue = (dueDate: Date): number => {
    if (!isOverdue(dueDate)) return 0;
    return differenceInDays(new Date(), dueDate);
};

export const getTrialEndDate = (startDate: Date, trialDays: number = 15): Date => {
    return addDays(startDate, trialDays);
};

// ============================================
// STRING UTILS
// ============================================
export const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

export const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, length: number): string => {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
};

// ID GENERATION
// ============================================
export const generateId = (): string => {
    // Simple UUID v4 generation (works in browser and Node)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
