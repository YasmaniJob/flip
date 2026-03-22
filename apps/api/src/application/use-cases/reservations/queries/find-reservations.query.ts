import { Inject, Injectable } from '@nestjs/common';
import { IReservationRepository } from '../../../../core/ports/outbound/reservation.repository';
import { InstitutionId } from '@flip/shared';

export interface FindReservationsInput {
    institutionId: string;
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    classroomId?: string;
    shift?: string;
}

@Injectable()
export class FindReservationsQuery {
    constructor(
        @Inject('IReservationRepository')
        private readonly reservationRepo: IReservationRepository,
    ) { }

    async execute(input: FindReservationsInput): Promise<any[]> {
        const institutionId = InstitutionId.fromString(input.institutionId);

        // If date range provided, return slots with enriched data
        if (input.startDate && input.endDate) {
            return await this.reservationRepo.findSlotsByDateRange(
                institutionId,
                input.startDate,
                input.endDate,
                input.classroomId,
                input.shift
            );
        }

        // Otherwise return reservations
        return await this.reservationRepo.findAll(institutionId, {
            staffId: input.staffId,
            status: 'active',
        });
    }

    async findMyTodaySlots(institutionId: string, staffId: string): Promise<any[]> {
        return await this.reservationRepo.findTodaySlotsByStaff(
            InstitutionId.fromString(institutionId),
            staffId
        );
    }
}
