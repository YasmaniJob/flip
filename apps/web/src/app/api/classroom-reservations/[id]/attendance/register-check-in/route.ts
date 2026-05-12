import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { 
  reservationAttendance, 
  staff, 
  users, 
  classroomReservations 
} from '@/lib/db/schema';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { eq, and, or } from 'drizzle-orm';
import { randomUUID, createHmac } from 'crypto';

/**
 * POST /api/classroom-reservations/:id/attendance/register-check-in
 * 
 * Flujo de auto-registro y asistencia (Estilo Evaluación Diagnóstica):
 * 1. Si el docente no existe, lo crea en Staff.
 * 2. Si no tiene cuenta de usuario, la crea automáticamente (Lazy Login).
 * 3. Registra la asistencia al taller.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;
    const body = await request.json();
    const { name, email: rawEmail, dni, phone } = body;
    const email = rawEmail.toLowerCase().trim();

    if (!dni || !name || !email) {
      throw new Error('DNI, Nombre y Email son obligatorios para el registro');
    }

    // 1. Obtener datos de la reserva para conocer la institución
    const reservation = await db.query.classroomReservations.findFirst({
      where: eq(classroomReservations.id, reservationId),
    });

    if (!reservation) {
      throw new Error('La sesión o taller no existe');
    }
    const institutionId = reservation.institutionId;

    // INICIO DE OPERACIÓN QUIRÚRGICA (Transaccional)
    const result = await db.transaction(async (tx) => {
      
      // PASO A: Buscar Staff por DNI + Institución (Ancla de identidad)
      let staffRecord = await tx.query.staff.findFirst({
        where: and(
          eq(staff.dni, dni),
          eq(staff.institutionId, institutionId)
        ),
      });

      if (staffRecord) {
        // REPARAR/ACTUALIZAR: Si existe, actualizamos email y nombre con los datos más recientes
        await tx.update(staff)
          .set({ 
            email: email, 
            name: name,
            phone: phone || staffRecord.phone,
            updatedAt: new Date() 
          })
          .where(eq(staff.id, staffRecord.id));
      } else {
        // Si no existe por DNI, probamos por Email en la misma institución
        const staffByEmail = await tx.query.staff.findFirst({
          where: and(
            eq(staff.email, email),
            eq(staff.institutionId, institutionId)
          ),
        });

        if (staffByEmail) {
          // Si lo encontramos por email pero el DNI era diferente, corregimos el DNI
          await tx.update(staff)
            .set({ 
              dni: dni, 
              name: name,
              phone: phone || staffByEmail.phone,
              updatedAt: new Date() 
            })
            .where(eq(staff.id, staffByEmail.id));
          staffRecord = staffByEmail;
        } else {
          // CREAR: Si no existe de ninguna forma, es un docente nuevo
          const [newStaff] = await tx.insert(staff).values({
            id: randomUUID(),
            institutionId,
            name,
            email,
            dni,
            phone,
            role: 'docente',
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
          staffRecord = newStaff;
        }
      }

      // PASO B: Sincronización con la tabla de Usuarios (Cuentas de acceso)
      let userRecord = await tx.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (userRecord) {
        // VINCULACIÓN: Si ya tenía cuenta (tal vez de otra inst o registro previo), 
        // nos aseguramos que su DNI e Institución estén vinculados a la identidad actual.
        await tx.update(users)
          .set({
            dni: dni,
            name: name,
            institutionId: institutionId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userRecord.id));
      } else {
        // CREACIÓN LAZY: Crear cuenta si no existe
        const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || 'beeclass-internal-secret';
        const internalPassword = createHmac('sha256', secret)
          .update(`lazy:${email}:${dni}`)
          .digest('hex');

        const [newUser] = await tx.insert(users).values({
          id: randomUUID(),
          email: email,
          name,
          dni,
          institutionId,
          role: 'docente',
          isSuperAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        userRecord = newUser;
      }

      // PASO C: Registro de Asistencia
      const existingAttendance = await tx.query.reservationAttendance.findFirst({
        where: and(
          eq(reservationAttendance.reservationId, reservationId),
          eq(reservationAttendance.staffId, staffRecord!.id)
        ),
      });

      let attendanceId = existingAttendance?.id;

      if (!existingAttendance) {
        const [newAttendance] = await tx.insert(reservationAttendance).values({
          id: randomUUID(),
          reservationId,
          staffId: staffRecord!.id,
          status: 'presente',
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();
        attendanceId = newAttendance.id;
      }

      return {
        staffId: staffRecord!.id,
        userId: userRecord.id,
        name: staffRecord!.name,
        alreadyRegistered: !!existingAttendance
      };
    });

    return successResponse(result, 'Identidad sincronizada y asistencia registrada', 201);

  } catch (error) {
    console.error('[Register Check-in Error]:', error);
    const message = error instanceof Error ? error.message : 'Error al procesar el registro';
    return errorResponse(new Error(message));
  }
}
