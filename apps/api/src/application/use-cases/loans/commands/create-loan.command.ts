import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CreateLoanPort, CreateLoanInput } from '../../../../core/ports/inbound/create-loan.port';
import { ILoanRepository } from '../../../../core/ports/outbound/loan.repository';
import { Loan } from '../../../../core/domain/entities/loan.entity';
import { InstitutionId } from '@flip/shared';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';

@Injectable()
export class CreateLoanCommand implements CreateLoanPort {
    constructor(
        @Inject('ILoanRepository')
        private readonly loanRepo: ILoanRepository,
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
    ) { }

    async execute(input: CreateLoanInput & { purposeDetails?: any }): Promise<Loan> {
        // 1. Validate availability in a single batch query
        // Skip for pending loans (docente) to avoid blocking inventory until approved
        if (input.resourceIds && input.resourceIds.length > 0) {
            const resources = await this.resourceRepo.findManyByIds(input.institutionId, input.resourceIds);

            // Check if all requested resources exist
            if (resources.length !== input.resourceIds.length) {
                throw new BadRequestException('Uno o más recursos solicitados no existen en la institución');
            }

            for (const resource of resources) {
                if (resource.status !== 'disponible') {
                    throw new BadRequestException(`El recurso "${resource.name}" no está disponible (Estado: ${resource.status})`);
                }
            }
        }

        const loan = Loan.create(
            InstitutionId.fromString(input.institutionId),
            input.staffId || null,
            input.requestedByUserId || null,
            input.resourceIds,
            input.purpose,
            input.notes,
            input.studentPickupNote,
            !!input.isDocente,
            input.purposeDetails
        );

        const savedLoan = await this.loanRepo.save(loan);

        // Mark resources as 'prestado' immediately — this prevents double-booking.
        // For pending loans (docente), resources will be held until approved or rejected.
        if (input.resourceIds && input.resourceIds.length > 0) {
            await this.resourceRepo.updateManyStatus(input.institutionId, input.resourceIds, 'prestado');
        }

        return savedLoan;
    }
}
