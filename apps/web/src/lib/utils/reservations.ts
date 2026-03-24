import { db } from '@/lib/db';
import { reservationSlots } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ValidationError, ForbiddenError } from './errors';

/**
 * Check if user can modify a reservation
 * Only the creator (staffId) or admin/superadmin can modify
 */
export function canModifyReservation(
  reservation: { staffId: string; institutionId: string },
  user: { id: string; role: string; institutionId: string }
): boolean {
  // Admin/SuperAdmin can modify any reservation in their institution
  if (user.role === 'admin' || user.role === 'superadmin') {
    return reservation.institutionId === user.institutionId;
  }

  // Creator can modify their own reservation
  return reservation.staffId === user.id;
}

/**
 * Validate that user can modify a reservation, throw error if not
 */
export function requireModifyPermission(
  reservation: { staffId: string; institutionId: string },
  user: { id: string; role: string; institutionId: string }
): void {
  if (!canModifyReservation(reservation, user)) {
    throw new ForbiddenError('No tienes permisos para modificar esta reserva');
  }
}

/**
 * Check if a slot conflicts with existing reservations
 * Returns true if there's a conflict
 */
export async function hasSlotConflict(
  classroomId: string,
  date: Date,
  pedagogicalHourId: string,
  excludeReservationId?: string
): Promise<boolean> {
  // Ensure date is normalized to UTC midnight
  const normalizedDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));

  const conditions = [
    eq(reservationSlots.classroomId, classroomId),
    eq(reservationSlots.date, normalizedDate),
    eq(reservationSlots.pedagogicalHourId, pedagogicalHourId),
  ];

  const existingSlots = await db.query.reservationSlots.findMany({
    where: and(...conditions),
    with: {
      reservation: true,
    },
  });

  // Filter out cancelled reservations and excluded reservation
  const activeConflicts = existingSlots.filter(
    (slot) =>
      slot.reservation.status === 'active' &&
      (!excludeReservationId || slot.reservationId !== excludeReservationId)
  );

  return activeConflicts.length > 0;
}

/**
 * Validate multiple slots for conflicts
 * Throws ValidationError if any conflict is found
 */
export async function validateSlotsNoConflicts(
  slots: Array<{ classroomId: string; date: Date; pedagogicalHourId: string }>,
  excludeReservationId?: string
): Promise<void> {
  for (const slot of slots) {
    const conflict = await hasSlotConflict(
      slot.classroomId,
      slot.date,
      slot.pedagogicalHourId,
      excludeReservationId
    );

    if (conflict) {
      const dateStr = slot.date.toISOString().split('T')[0];
      throw new ValidationError(
        `El horario ya está reservado: ${dateStr} - Hora pedagógica ${slot.pedagogicalHourId}`
      );
    }
  }
}

/**
 * Normalize date string to Date object with time set to 00:00:00 UTC
 * Handles both ISO 8601 full format and simple YYYY-MM-DD format
 */
export function normalizeDate(dateStr: string): Date {
  // Extract just the date part if it's ISO format
  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  
  if (dateMatch) {
    const [, year, month, day] = dateMatch.map(Number);
    // Create date in UTC to avoid timezone issues
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }
  
  // Fallback for other formats
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
