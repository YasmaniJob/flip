import { InstitutionId, generateId } from '@flip/shared';

export type LoanStatus = 'active' | 'returned' | 'overdue';
export type LoanApprovalStatus = 'pending' | 'approved' | 'rejected';

export class Loan {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public readonly staffId: string | null,
        public readonly requestedByUserId: string | null,
        public status: LoanStatus,
        public approvalStatus: LoanApprovalStatus,
        public readonly loanDate: Date,
        public returnDate: Date | null,
        public readonly purpose: string | null,
        public readonly notes: string | null,
        public readonly studentPickupNote: string | null,
        public readonly createdAt: Date | undefined,
        public readonly items: string[] = [],
        public readonly damageReports?: any,
        public readonly suggestionReports?: any,
        public readonly missingResources?: any,
        public readonly purposeDetails?: { gradeId?: string; sectionId?: string; curricularAreaId?: string },
    ) { }

    static create(
        institutionId: InstitutionId,
        staffId: string | null,
        requestedByUserId: string | null,
        items: string[],
        purpose: string | undefined,
        notes: string | undefined,
        studentPickupNote: string | undefined,
        isDocente: boolean,
        purposeDetails?: { gradeId?: string; sectionId?: string; curricularAreaId?: string }
    ): Loan {
        return new Loan(
            generateId(),
            institutionId,
            staffId,
            requestedByUserId,
            'active',
            isDocente ? 'pending' : 'approved',
            new Date(),
            null,
            purpose || null,
            notes || null,
            studentPickupNote || null,
            new Date(),
            items,
            undefined,
            undefined,
            undefined,
            purposeDetails
        );
    }

    markAsReturned() {
        this.status = 'returned';
        this.returnDate = new Date();
    }

    approve() {
        this.approvalStatus = 'approved';
        this.status = 'active';
    }

    reject() {
        this.approvalStatus = 'rejected';
    }
}
