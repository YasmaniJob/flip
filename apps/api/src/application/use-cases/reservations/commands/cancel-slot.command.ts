import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '../../../../database/database.module';
import * as schema from '../../../../database/schema';

export interface CancelSlotInput {
    institutionId: string;
    slotId: string;
    userId: string;
    userRole: string;
    isSuperAdmin?: boolean;
}

@Injectable()
export class CancelSlotCommand {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async execute(input: CancelSlotInput): Promise<{ success: boolean }> {
        // Get the slot with its reservation
        const slotResult = await this.db
            .select()
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

        if (slotResult.length === 0) {
            throw new NotFoundException('Slot no encontrado');
        }

        const slot = slotResult[0].reservation_slots;
        const reservation = slotResult[0].classroom_reservations;

        // SuperAdmin and Admin have full permissions
        const isSuperAdmin = input.isSuperAdmin === true;
        const isAdmin = input.userRole === 'admin';
        const isOwner = reservation.staffId === input.userId;
        const isPIP = input.userRole === 'pip';

        if (!isSuperAdmin && !isAdmin && !isOwner && !isPIP) {
            throw new ForbiddenException('No tienes permiso para cancelar este slot');
        }

        // Delete the slot
        await this.db
            .delete(schema.reservationSlots)
            .where(eq(schema.reservationSlots.id, input.slotId));

        // Check if reservation has any remaining slots
        const remainingSlots = await this.db
            .select()
            .from(schema.reservationSlots)
            .where(eq(schema.reservationSlots.reservationId, reservation.id))
            .limit(1);

        // If no slots remain, cancel the entire reservation
        if (remainingSlots.length === 0) {
            await this.db
                .update(schema.classroomReservations)
                .set({ status: 'cancelled' })
                .where(eq(schema.classroomReservations.id, reservation.id));
        }

        return { success: true };
    }
}
