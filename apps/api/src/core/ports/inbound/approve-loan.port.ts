import { Loan } from '../../domain/entities/loan.entity';

export interface ApproveLoanInput {
    institutionId: string;
    loanId: string;
}

export interface ApproveLoanPort {
    execute(input: ApproveLoanInput): Promise<Loan>;
}
