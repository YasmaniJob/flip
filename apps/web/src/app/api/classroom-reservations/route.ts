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
import { eq, desc, and, asc } from 'drizzle-orm';

// GET /api/classroom-reservations - List reservations with filters
// Updated: 2026-03-22 01:05 - Manual relation loading to avoid Drizzle issues
export async function GET(request: NextRequest) {
  const start = Date.now();
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = validateQuery(reservationsQuerySchema, searchParams);

    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(classroomReservations.institutionId, institutionId)];

    if (query.classroomId) {
      conditions.push(eq(classroomReservations.classroomId, query.classroomId));
    }

    // Get reservations WITHOUT nested relations
    const reservationsList = await db.query.classroomReservations.findMany({
      where: and(...conditions),
      orderBy: [desc(classroomReservations.createdAt)],
      limit,
      offset,
    });

    // Manually load relations for each reservation
    const reservationsWithRelations = await Promise.all(
      reservationsList.map(async (reservation) => {
        // Load slots
        const slots = await db.query.reservationSlots.findMany({
          where: eq(reservationSlots.reservationId, reservation.id),
          orderBy: [asc(reservationSlots.date)],
        });

        // Load pedagogical hours for slots
        const slotsWithHours = await Promise.all(
          slots.map(async (slot) => {
            const pedagogicalHour = slot.pedagogicalHourId
              ? await db.query.pedagogicalHours.findFirst({
                  where: eq(pedagogicalHours.id, slot.pedagogicalHourId),
                })
              : null;
            return { ...slot, pedagogicalHour };
          })
        );

        // Load other relations
        const [classroom, staffMember, grade, section, curricularArea] = await Promise.all([
          reservation.classroomId
            ? db.query.classrooms.findFirst({ where: eq(classrooms.id, reservation.classroomId) })
            : Promise.resolve(null),
          db.query.staff.findFirst({ where: eq(staff.id, reservation.staffId) }),
          reservation.gradeId
            ? db.query.grades.findFirst({ where: eq(grades.id, reservation.gradeId) })
            : Promise.resolve(null),
          reservation.sectionId
            ? db.query.sections.findFirst({ where: eq(sections.id, reservation.sectionId) })
            : Promise.resolve(null),
          reservation.curricularAreaId
            ? db.query.curricularAreas.findFirst({ where: eq(curricularAreas.id, reservation.curricularAreaId) })
            : Promise.resolve(null),
        ]);

        // Load user for staff
        const userForStaff = staffMember?.userId
          ? await db.query.users.findFirst({ where: eq(users.id, staffMember.userId) })
          : null;

        return {
          ...reservation,
          classroom,
          staff: staffMember ? { ...staffMember, user: userForStaff } : null,
          grade,
          section,
          curricularArea,
          slots: slotsWithHours,
        };
      })
    );

    // Filter by date range if provided
    let filteredReservations = reservationsWithRelations;
    if (query.startDate || query.endDate) {
      const startDate = query.startDate ? normalizeDate(query.startDate) : null;
      const endDate = query.endDate ? normalizeDate(query.endDate) : null;

      filteredReservations = reservationsWithRelations
        .map((reservation) => ({
          ...reservation,
          slots: reservation.slots.filter((slot) => {
            const slotDate = normalizeDate(slot.date.toISOString());
            if (startDate && slotDate < startDate) return false;
            if (endDate && slotDate > endDate) return false;
            return true;
          }),
        }))
        .filter((reservation) => reservation.slots.length > 0);
    }

    // Filter by shift if provided
    if (query.shift) {
      filteredReservations = filteredReservations
        .map((reservation) => ({
          ...reservation,
          slots: reservation.slots.filter(
            (slot) => slot.pedagogicalHour?.shift === query.shift
          ),
        }))
        .filter((reservation) => reservation.slots.length > 0);
    }

    const total = filteredReservations.length;

    console.log(`[TIMING] classroom-reservations GET: ${Date.now() - start}ms`);
    return paginatedResponse(filteredReservations, {
      page,
      limit,
      total,
    });
  } catch (error) {
    console.log(`[TIMING] classroom-reservations GET ERROR: ${Date.now() - start}ms`);
    return errorResponse(error);
  }
}

// POST /api/classroom-reservations - Create reservation with slots
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const institutionId = getInstitutionId(user);

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
        staff: {
          with: {
            user: true,
          },
        },
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
