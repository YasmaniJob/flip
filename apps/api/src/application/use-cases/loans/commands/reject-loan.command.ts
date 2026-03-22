import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ILoanRepository } from '../../../../core/ports/outbound/loan.repository';
import { Loan } from '../../../../core/domain/entities/loan.entity';
import { InstitutionId } from '@flip/shared';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';

export interface RejectLoanInput {
    institutionId: string;
    loanId: string;
}

@Injectable()
export class RejectLoanCommand {
    constructor(
        @Inject('ILoanRepository')
        private readonly loanRepo: ILoanRepository,
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
    ) { }

    async execute(input: RejectLoanInput): Promise<Loan> {
        const institutionId = InstitutionId.fromString(input.institutionId);
        const loan = await this.loanRepo.findById(input.loanId, institutionId);

        if (!loan) {
            throw new NotFoundException('Préstamo no encontrado');
        }

        loan.reject();
        const updated = await this.loanRepo.update(loan);

        // Release resources back to 'disponible' since the loan was rejected
        if (loan.items && loan.items.length > 0) {
            try {
                await this.resourceRepo.updateManyStatus(input.institutionId, loan.items, 'disponible');
            } catch (err) {
                console.warn(`[RejectLoan] Could not release resources:`, err instanceof Error ? err.message : String(err));
            }
        }

        return updated;
    }
}
