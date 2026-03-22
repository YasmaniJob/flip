import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../../../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { generateId } from '@flip/shared';

export interface RescheduleBlockInput {
    institutionId: string;
    reservationId: string;
    userId: string;
    userRole: string;
    newSlots: { newDate: Date; newPedagogicalHourId: string }[];
    isSuperAdmin?: boolean;
}

@Injectable()
export class RescheduleBlockCommand {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async execute(input: RescheduleBlockInput): Promise<{ success: boolean }> {
        if (!input.newSlots || input.newSlots.length === 0) {
            throw new BadRequestException('Se debe proveer por lo menos un horario nuevo');
        }

        // 1. Get the reservation to verify existence and ownership
        const reservation = await this.db.query.classroomReservations.findFirst({
            where: and(
                eq(schema.classroomReservations.id, input.reservationId),
                eq(schema.classroomReservations.institutionId, input.institutionId)
            ),
            with: {
                slots: true
            }
        });

        if (!reservation || reservation.status !== 'active') {
            throw new NotFoundException('Reserva no encontrada o inactiva');
        }

        // 2. Check permissions: SuperAdmin and Admin have full permissions
        const isSuperAdmin = input.isSuperAdmin === true;
        const isAdmin = input.userRole === 'admin';
        const isOwner = reservation.staffId === input.userId;
        const isPIP = input.userRole === 'pip';

        if (!isSuperAdmin && !isAdmin && !isOwner && !isPIP) {
            throw new ForbiddenException('No tienes permiso para reprogramar esta reserva');
        }

        // 3. Optional constraint: maintain block size
        // If we want stringency, we could enforce: if (reservation.slots.length !== input.newSlots.length) ...
        // But for flexibility we'll just allow resizing if front-end allows, though the plan is to match array size.

        // 4. Verify all new slots are available
        // We need to check if ANY of the new dates/hours are already taken by another ACTIVE reservation
        for (const slot of input.newSlots) {
            const existingSlot = await this.db
                .select({
                    slotId: schema.reservationSlots.id,
                    resId: schema.classroomReservations.id,
                })
                .from(schema.reservationSlots)
                .innerJoin(
                    schema.classroomReservations,
                    eq(schema.reservationSlots.reservationId, schema.classroomReservations.id)
                )
                .where(and(
                    eq(schema.reservationSlots.institutionId, input.institutionId),
                    eq(schema.reservationSlots.date, slot.newDate),
                    eq(schema.reservationSlots.pedagogicalHourId, slot.newPedagogicalHourId),
                    eq(schema.classroomReservations.status, 'active')
                ))
                .limit(1);

            if (existingSlot.length > 0) {
                // Ignore if the conflicting slot actually belongs to THIS SAME reservation 
                // (e.g., they are just sliding it 1 hour forward and overlapping their own original slot)
                if (existingSlot[0].resId !== input.reservationId) {
                    throw new BadRequestException('Uno o más de los horarios seleccionados ya están reservados');
                }
            }
        }

        // 5. Transaction: Remove old slots, insert new ones
        await this.db.transaction(async (tx) => {
            // Delete old slots for this reservation
            await tx.delete(schema.reservationSlots)
                .where(eq(schema.reservationSlots.reservationId, input.reservationId));

            // Insert new slots
            const insertValues = input.newSlots.map(slot => ({
                id: generateId(),
                reservationId: input.reservationId,
                institutionId: input.institutionId,
                pedagogicalHourId: slot.newPedagogicalHourId,
                date: slot.newDate,
                attended: false,
                attendedAt: null,
                classroomId: reservation.classroomId!,
            }));

            await tx.insert(schema.reservationSlots).values(insertValues);
        });

        return { success: true };
    }
}
