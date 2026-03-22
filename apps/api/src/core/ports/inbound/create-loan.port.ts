import { Loan } from '../../domain/entities/loan.entity';

export interface CreateLoanInput {
    institutionId: string;
    staffId?: string;
    requestedByUserId?: string;
    resourceIds: string[];
    purpose?: string;
    notes?: string;
    studentPickupNote?: string;
    isDocente?: boolean;
}

export interface CreateLoanPort {
    execute(input: CreateLoanInput): Promise<Loan>;
}
