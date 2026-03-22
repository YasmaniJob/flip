import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ApproveLoanPort, ApproveLoanInput } from '../../../../core/ports/inbound/approve-loan.port';
import { ILoanRepository } from '../../../../core/ports/outbound/loan.repository';
import { Loan } from '../../../../core/domain/entities/loan.entity';
import { InstitutionId } from '@flip/shared';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';

@Injectable()
export class ApproveLoanCommand implements ApproveLoanPort {
    constructor(
        @Inject('ILoanRepository')
        private readonly loanRepo: ILoanRepository,
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
    ) { }

    async execute(input: ApproveLoanInput): Promise<Loan> {
        const institutionId = InstitutionId.fromString(input.institutionId);
        const loan = await this.loanRepo.findById(input.loanId, institutionId);

        if (!loan) {
            throw new NotFoundException('Préstamo no encontrado');
        }

        loan.approve();
        const updated = await this.loanRepo.update(loan);

        // Mark resources as 'prestado' — they were already held since loan creation,
        // this is a no-op in practice but ensures consistency.
        if (loan.items && loan.items.length > 0) {
            try {
                await this.resourceRepo.updateManyStatus(input.institutionId, loan.items, 'prestado');
            } catch (err) {
                console.warn(`[ApproveLoan] Could not update resources status:`, err instanceof Error ? err.message : String(err));
            }
        }

        return updated;
    }
}
