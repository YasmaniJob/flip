import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Parses a date string safely to local time at midnight (00:00:00).
 * Handles ISO strings and YYYY-MM-DD formats.
 */
export function parseDateSafe(dateInput: string | Date | undefined | null): Date {
    if (!dateInput) return new Date();

    const dateString = typeof dateInput === 'string' ? dateInput : dateInput.toISOString();
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateMatch) {
        const [, year, month, day] = dateMatch.map(Number);
        return new Date(year, month - 1, day);
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date();

    // Normalize to midnight
    date.setHours(0, 0, 0, 0);
    return date;
}

/**
 * Formats a date using local time.
 */
export function formatDateLocal(date: Date, formatStr: string = "EEEE, d 'de' MMMM"): string {
    if (!date || isNaN(date.getTime())) return 'Fecha inválida';
    return format(date, formatStr, { locale: es });
}

/**
 * Returns a YYYY-MM-DD string from a Date object in local time.
 */
export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Gets the start of the week for a given date.
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
