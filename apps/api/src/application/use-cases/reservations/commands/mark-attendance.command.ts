import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE } from '../../../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { InstitutionId } from '@flip/shared';

export interface MarkAttendanceInput {
    institutionId: string;
    slotId: string;
    staffId: string;
    attended: boolean;
    userRole?: string;
    isSuperAdmin?: boolean;
}

@Injectable()
export class MarkAttendanceCommand {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async execute(input: MarkAttendanceInput): Promise<{ success: boolean }> {
        // Get slot with reservation to verify ownership
        const slot = await this.db
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

        if (!slot.length) {
            throw new NotFoundException('Slot no encontrado');
        }

        // Verify ownership: only the staff who made the reservation can mark attendance
        // UNLESS the user is an admin or superadmin
        const isAdmin =
            input.userRole === 'admin' ||
            input.userRole === 'superadmin' ||
            input.userRole === 'SuperAdmin' ||
            input.isSuperAdmin === true;

        if (!isAdmin && slot[0].reservation.staffId !== input.staffId) {
            throw new ForbiddenException(`DEBUG: Role=${input.userRole}, Super=${input.isSuperAdmin}, StaffId=${input.staffId}, Owner=${slot[0].reservation.staffId}`);
        }

        // Update attendance
        await this.db
            .update(schema.reservationSlots)
            .set({
                attended: input.attended,
                attendedAt: input.attended ? new Date() : null,
            })
            .where(eq(schema.reservationSlots.id, input.slotId));

        return { success: true };
    }
}
