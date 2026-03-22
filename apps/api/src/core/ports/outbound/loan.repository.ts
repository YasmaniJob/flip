import { Loan } from '../../domain/entities/loan.entity';
import { InstitutionId } from '@flip/shared';

export interface ILoanRepository {
    save(loan: Loan): Promise<Loan>;
    findById(id: string, institutionId: InstitutionId): Promise<Loan | null>;
    findAll(institutionId: InstitutionId): Promise<Loan[]>;
    update(loan: Loan): Promise<Loan>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;
    // Domain specific
    findActiveByStaff(staffId: string, institutionId: InstitutionId): Promise<Loan[]>;
}
