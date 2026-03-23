import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { 
  classroomReservations, 
  reservationSlots, 
  staff, 
  classrooms,
  pedagogicalHours,
  grades,
  sections,
  curricularAreas,
  users
} from '@/lib/db/schema';
import { requireAuth, getInstitutionId } from '@/lib/auth/helpers';
import { validateBody, validateQuery } from '@/lib/validations/helpers';
import { createReservationSchema, reservationsQuerySchema } from '@/lib/validations/schemas/reservations';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/utils/response';
import { NotFoundError } from '@/lib/utils/errors';
import { validateSlotsNoConflicts, normalizeDate } from '@/lib/utils/reservations';
import { eq, desc, and, asc, gte, lte, sql } from 'drizzle-orm';

// GET /api/classroom-reservations - List reservations with filters
// Updated: 2026-03-22 12:30 - Optimized with single query using Drizzle relations
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = validateQuery(reservationsQuerySchema, searchParams);

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    // Build where conditions for reservations
    const conditions = [eq(classroomReservations.institutionId, institutionId)];

    if (query.classroomId) {
      conditions.push(eq(classroomReservations.classroomId, query.classroomId));
    }

    // Build where conditions for slots based on date filters
    const slotsWhereConditions = [];
    if (query.startDate) {
      slotsWhereConditions.push(gte(reservationSlots.date, new Date(normalizeDate(query.startDate))));
    }
    if (query.endDate) {
      slotsWhereConditions.push(lte(reservationSlots.date, new Date(normalizeDate(query.endDate))));
    }

    // Get reservations WITH all nested relations in a single query
    const reservationsWithRelations = await db.query.classroomReservations.findMany({
      where: and(...conditions),
      with: {
        classroom: true,
        staff: true,
        grade: true,
        section: true,
        curricularArea: true,
        slots: {
          where: slotsWhereConditions.length > 0 ? and(...slotsWhereConditions) : undefined,
          with: {
            pedagogicalHour: true,
          },
          orderBy: [asc(reservationSlots.date)],
        },
      },
      orderBy: [desc(classroomReservations.createdAt)],
      limit,
      offset,
    });

    // Filter by shift if provided (keep in memory as it's on pedagogicalHour)
    let filteredReservations = reservationsWithRelations;
    if (query.shift) {
      filteredReservations = reservationsWithRelations
        .map((reservation) => ({
          ...reservation,
          slots: reservation.slots.filter(
            (slot) => slot.pedagogicalHour?.shift === query.shift
          ),
        }))
        .filter((reservation) => reservation.slots.length > 0);
    }

    // Filter out reservations with no slots (after date filtering in DB)
    filteredReservations = filteredReservations.filter((reservation) => reservation.slots.length > 0);

    const total = filteredReservations.length;

    console.log(`[TIMING] classroom-reservations GET: ${Date.now() - start}ms`);
    return paginatedResponse(filteredReservations, {
      page,
      limit,
      total,
    });
  } catch (error) {
    console.error('[ERROR] classroom-reservations GET:', error);
    console.log(`[TIMING] classroom-reservations GET ERROR: ${Date.now() - start}ms`);
    return errorResponse(error);
  }
}

// POST /api/classroom-reservations - Create reservation with slots
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = await getInstitutionId(user);

    const body = await request.json();
    const data = validateBody(createReservationSchema, body);

    // Verify staff exists and belongs to institution
    const staffRecord = await db.query.staff.findFirst({
      where: and(
        eq(staff.id, data.staffId),
        eq(staff.institutionId, institutionId)
      ),
    });

    if (!staffRecord) {
      throw new NotFoundError('Personal no encontrado');
    }

    // If classroomId provided, verify it exists
    if (data.classroomId) {
      const classroom = await db.query.classrooms.findFirst({
        where: and(
          eq(classrooms.id, data.classroomId),
          eq(classrooms.institutionId, institutionId)
        ),
      });

      if (!classroom) {
        throw new NotFoundError('Aula no encontrada');
      }
    }

    // Validate no conflicts for all slots
    const slotsToValidate = data.slots.map((slot) => ({
      classroomId: data.classroomId!,
      date: normalizeDate(slot.date),
      pedagogicalHourId: slot.pedagogicalHourId,
    }));

    await validateSlotsNoConflicts(slotsToValidate);

    // Create reservation + slots in transaction
    const result = await db.transaction(async (tx) => {
      // Insert reservation
      const [reservation] = await tx
        .insert(classroomReservations)
        .values({
          institutionId,
          staffId: data.staffId,
          classroomId: data.classroomId,
          gradeId: data.gradeId,
          sectionId: data.sectionId,
          curricularAreaId: data.curricularAreaId,
          type: data.type || 'class',
          title: data.title,
          purpose: data.purpose,
          status: 'active',
        })
        .returning();

      // Insert slots
      const slotsData = data.slots.map((slot) => ({
        reservationId: reservation.id,
        institutionId,
        classroomId: data.classroomId!,
        pedagogicalHourId: slot.pedagogicalHourId,
        date: normalizeDate(slot.date),
        attended: false,
      }));

      const createdSlots = await tx
        .insert(reservationSlots)
        .values(slotsData)
        .returning();

      return { reservation, slots: createdSlots };
    });

    // Return with relations
    const reservationWithRelations = await db.query.classroomReservations.findFirst({
      where: eq(classroomReservations.id, result.reservation.id),
      with: {
        classroom: true,
        staff: true,
        grade: true,
        section: true,
        curricularArea: true,
        slots: {
          with: {
            pedagogicalHour: true,
          },
        },
      },
    });

    return successResponse(reservationWithRelations, 'Reserva creada exitosamente', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
