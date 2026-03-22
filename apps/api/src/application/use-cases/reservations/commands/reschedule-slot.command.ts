import { Inject, Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../../../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../../database/schema';

export interface RescheduleSlotInput {
    institutionId: string;
    slotId: string;
    userId: string;
    userRole: string;
    newDate: Date;
    newPedagogicalHourId: string;
    isSuperAdmin?: boolean;
}

@Injectable()
export class RescheduleSlotCommand {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async execute(input: RescheduleSlotInput): Promise<{ success: boolean }> {
        // Get slot with reservation to verify ownership
        const slotResult = await this.db
            .select({
                slot: schema.reservationSlots,
                reservation: schema.classroomReservations,
            })
            .from(schema.reservationSlots)
            .innerJoin(
                schema.classroomReservations,
                eq(schema.reservationSlots.reservationId, schema.classroomReservations.id)
            )
            .where(and(
                eq(schema.reservationSlots.id, input.slotId),
                eq(schema.reservationSlots.institutionId, input.institutionId)
            ))
            .limit(1);

        if (!slotResult.length) {
            throw new NotFoundException('Slot no encontrado');
        }

        const { slot, reservation } = slotResult[0];

        // SuperAdmin and Admin have full permissions
        const isSuperAdmin = input.isSuperAdmin === true;
        const isAdmin = input.userRole === 'admin';
        const isOwner = reservation.staffId === input.userId;
        const isPIP = input.userRole === 'pip';

        if (!isSuperAdmin && !isAdmin && !isOwner && !isPIP) {
            throw new ForbiddenException('No tienes permiso para reprogramar esta reserva');
        }

        // Check if new slot is already taken
        const existingSlot = await this.db
            .select()
            .from(schema.reservationSlots)
            .innerJoin(
                schema.classroomReservations,
                eq(schema.reservationSlots.reservationId, schema.classroomReservations.id)
            )
            .where(and(
                eq(schema.reservationSlots.institutionId, input.institutionId),
                eq(schema.reservationSlots.date, input.newDate),
                eq(schema.reservationSlots.pedagogicalHourId, input.newPedagogicalHourId),
                eq(schema.classroomReservations.status, 'active')
            ))
            .limit(1);

        if (existingSlot.length > 0) {
            throw new BadRequestException('El horario seleccionado ya está reservado');
        }

        // Update slot
        await this.db
            .update(schema.reservationSlots)
            .set({
                date: input.newDate,
                pedagogicalHourId: input.newPedagogicalHourId,
            })
            .where(eq(schema.reservationSlots.id, input.slotId));

        return { success: true };
    }
}
