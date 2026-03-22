import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IReservationRepository } from '../../../../core/ports/outbound/reservation.repository';
import { ClassroomReservation } from '../../../../core/domain/entities/classroom-reservation.entity';
import { InstitutionId } from '@flip/shared';

export interface CancelReservationInput {
    institutionId: string;
    reservationId: string;
    userId: string;
    userRole: string;
    isSuperAdmin?: boolean;
}

@Injectable()
export class CancelReservationCommand {
    constructor(
        @Inject('IReservationRepository')
        private readonly reservationRepo: IReservationRepository,
    ) { }

    async execute(input: CancelReservationInput): Promise<ClassroomReservation> {
        const reservation = await this.reservationRepo.findById(
            input.reservationId,
            InstitutionId.fromString(input.institutionId)
        );

        if (!reservation) {
            throw new NotFoundException('Reserva no encontrada');
        }

        // SuperAdmin and Admin have full permissions
        const isSuperAdmin = input.isSuperAdmin === true;
        const isAdmin = input.userRole === 'admin';
        const isOwner = reservation.staffId === input.userId;
        const isPIP = input.userRole === 'pip';

        if (!isSuperAdmin && !isAdmin && !isOwner && !isPIP) {
            throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
        }

        if (reservation.status === 'cancelled') {
            throw new ForbiddenException('Esta reserva ya fue cancelada');
        }

        reservation.cancel();
        return await this.reservationRepo.update(reservation);
    }
}
