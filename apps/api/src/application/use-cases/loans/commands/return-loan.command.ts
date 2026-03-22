import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ILoanRepository } from '../../../../core/ports/outbound/loan.repository';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';
import { Loan } from '../../../../core/domain/entities/loan.entity';
import { InstitutionId } from '@flip/shared';

export interface ReturnLoanInput {
    institutionId: string;
    loanId: string;
    resourcesReceived: string[];
    damageReports?: Record<string, unknown>;
    suggestionReports?: Record<string, unknown>;
    missingResources?: Array<{ resourceId: string; resourceName: string; notes?: string }>;
    resourceStatusDecisions?: Record<string, 'disponible' | 'mantenimiento' | 'baja'>;
}

@Injectable()
export class ReturnLoanCommand {
    constructor(
        @Inject('ILoanRepository')
        private readonly loanRepo: ILoanRepository,
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
    ) { }

    async execute(input: ReturnLoanInput): Promise<Loan> {
        const institutionId = InstitutionId.fromString(input.institutionId);

        const loan = await this.loanRepo.findById(input.loanId, institutionId);
        if (!loan) {
            throw new NotFoundException('Préstamo no encontrado');
        }

        if (loan.status !== 'active') {
            throw new BadRequestException('El préstamo ya ha sido devuelto');
        }

        const updatedLoan = new Loan(
            loan.id,
            loan.institutionId,
            loan.staffId,
            loan.requestedByUserId,
            'returned',
            loan.approvalStatus,
            loan.loanDate,
            new Date(),
            loan.purpose,
            loan.notes,
            loan.studentPickupNote,
            undefined,
            loan.items,
            input.damageReports,
            input.suggestionReports,
            input.missingResources,
        );

        await this.loanRepo.update(updatedLoan);

        // Mark received resources as available (or their decided status).
        // Resources not in resourcesReceived remain 'prestado' (implicitly missing).
        const availableResourceIds: string[] = [];

        for (const resourceId of input.resourcesReceived ?? []) {
            const newStatus = input.resourceStatusDecisions?.[resourceId] ?? 'disponible';
            if (newStatus === 'disponible') {
                availableResourceIds.push(resourceId);
            } else {
                // If it needs maintenance or decommissioning, update individually for safety/clarity,
                // or group them by status if there are many. Since maintenance items are few, individual is fine.
                await this.resourceRepo.update(input.institutionId, resourceId, { status: newStatus as any });
            }
        }

        if (availableResourceIds.length > 0) {
            await this.resourceRepo.updateManyStatus(input.institutionId, availableResourceIds, 'disponible');
        }

        return updatedLoan;
    }
}
