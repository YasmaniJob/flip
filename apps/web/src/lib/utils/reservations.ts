import { db } from '@/lib/db';
import { reservationSlots, staff } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { ValidationError, ForbiddenError } from './errors';

/**
 * Check if user can modify a reservation
 * Only the creator (staffId) or admin/superadmin can modify
 */
export async function canModifyReservation(
  reservation: { staffId: string; institutionId: string },
  user: { id: string; email: string; role: string | null | undefined; institutionId?: string | null | undefined; }
): Promise<boolean> {
  // Admin/SuperAdmin/PIP can modify any reservation in their institution
  if (user.role === 'admin' || user.role === 'superadmin' || user.role === 'pip') {
    return reservation.institutionId === user.institutionId;
  }

  // Cross-institutional check
  if (!user.institutionId || reservation.institutionId !== user.institutionId) return false;

  // Resolve staff ID for current user
  const myStaff = await db.query.staff.findFirst({
    where: and(
        eq(staff.institutionId, user.institutionId),
        eq(staff.email, user.email)
    ),
    columns: { id: true }
  });

  // Creator can modify their own reservation
  return reservation.staffId === myStaff?.id;
}

/**
 * Validate that user can modify a reservation, throw error if not
 */
export async function requireModifyPermission(
  reservation: { staffId: string; institutionId: string },
  user: { id: string; email: string; role: string | null | undefined; institutionId?: string | null | undefined; }
): Promise<void> {
  const hasPermission = await canModifyReservation(reservation, user);
  if (!hasPermission) {
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
  if (slots.length === 0) return;

  // Build a complex OR query for all slots at once
  const slotConditions = slots.map(slot => {
    const normalizedDate = new Date(Date.UTC(
      slot.date.getUTCFullYear(),
      slot.date.getUTCMonth(),
      slot.date.getUTCDate(),
      0, 0, 0, 0
    ));
    
    return and(
      eq(reservationSlots.classroomId, slot.classroomId),
      eq(reservationSlots.date, normalizedDate),
      eq(reservationSlots.pedagogicalHourId, slot.pedagogicalHourId)
    );
  });

  const existingSlots = await db.query.reservationSlots.findMany({
    where: or(...slotConditions),
    with: {
      reservation: {
        columns: { id: true, status: true }
      },
    },
  });

  // Check for active conflicts
  const conflicts = existingSlots.filter(
    (slot) =>
      slot.reservation.status === 'active' &&
      (!excludeReservationId || slot.reservationId !== excludeReservationId)
  );

  if (conflicts.length > 0) {
    const dateStr = new Date(conflicts[0].date).toISOString().split('T')[0];
    throw new ValidationError(
      `Conflicto en reserva: El ${dateStr} ya tiene una reserva activa.`
    );
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
