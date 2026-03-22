import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { IReservationRepository } from '../../../../core/ports/outbound/reservation.repository';
import { ClassroomReservation } from '../../../../core/domain/entities/classroom-reservation.entity';
import { InstitutionId } from '@flip/shared';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../../database/schema';
import { DRIZZLE } from '../../../../database/database.module';

export interface CreateReservationInput {
    institutionId: string;
    staffId: string;
    classroomId?: string;
    slots: { pedagogicalHourId: string; date: Date }[];
    gradeId?: string;
    sectionId?: string;
    curricularAreaId?: string;
    purpose?: string;
    type?: 'class' | 'workshop';
    title?: string;
}

@Injectable()
export class CreateReservationCommand {
    constructor(
        @Inject('IReservationRepository')
        private readonly reservationRepo: IReservationRepository,
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async execute(input: CreateReservationInput): Promise<ClassroomReservation> {
        // Ensure staff exists (handle Admin case where ID is from users table but not in staff table)
        await this.ensureStaffExists(input.staffId, input.institutionId);

        if (!input.classroomId) {
            throw new ConflictException('El aula es obligatoria para realizar una reserva');
        }

        if (input.type === 'workshop' && !input.title) {
            throw new ConflictException('Los talleres requieren un título');
        }

        const reservation = ClassroomReservation.create(
            InstitutionId.fromString(input.institutionId),
            input.staffId,
            input.slots,
            input.gradeId,
            input.sectionId,
            input.curricularAreaId,
            input.purpose,
            input.type || 'class',
            input.title,
            input.classroomId
        );

        try {
            return await this.reservationRepo.save(reservation);
        } catch (error: any) {
            console.error('Error creating reservation:', error);
            // Check for unique constraint violation
            if (error.code === '23505' || error.message?.includes('unique')) {
                throw new ConflictException('Uno o más horarios ya están reservados');
            }
            throw error;
        }
    }

    private async ensureStaffExists(staffId: string, institutionId: string): Promise<void> {
        // Check if exists in staff table
        const staffExists = await this.db.query.staff.findFirst({
            where: (staff, { eq, and }) => and(
                eq(staff.id, staffId),
                eq(staff.institutionId, institutionId)
            )
        });

        if (staffExists) return;

        // If not in staff, check if it's a User (Admin/SuperAdmin)
        const user = await this.db.query.users.findFirst({
            where: (users, { eq, and }) => and(
                eq(users.id, staffId),
                eq(users.institutionId, institutionId)
            )
        });

        if (!user) {
            throw new NotFoundException('El personal o usuario responsable no existe');
        }

        // If user exists, sync to staff table to satisfy FK
        await this.db.insert(schema.staff).values({
            id: user.id, // Keep same ID
            institutionId: user.institutionId!,
            name: user.name,
            dni: user.dni,
            email: user.email,
            role: user.isSuperAdmin ? 'SuperAdmin' : 'Admin',
            area: 'Dirección', // Default for admins
            status: 'active',
        }).onConflictDoNothing(); // Safe in case race condition
    }
}
