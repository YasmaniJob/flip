import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { ILoanRepository } from '../../../../core/ports/outbound/loan.repository';
import { Loan, LoanStatus, LoanApprovalStatus } from '../../../../core/domain/entities/loan.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleLoanRepository implements ILoanRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.loans.$inferSelect, items: string[] = []): Loan {
        return new Loan(
            row.id,
            InstitutionId.create(row.institutionId),
            row.staffId,
            row.requestedByUserId ?? null,
            (row.status || 'active') as LoanStatus,
            (row.approvalStatus || 'approved') as LoanApprovalStatus,
            row.loanDate || new Date(),
            row.returnDate,
            row.purpose,
            row.notes,
            row.studentPickupNote ?? null,
            undefined, // createdAt
            items,
            row.damageReports,
            row.suggestionReports,
            row.missingResources,
            row.purposeDetails as any
        );
    }

    async save(loan: Loan): Promise<Loan> {
        await this.db.transaction(async (tx) => {
            await tx.insert(schema.loans).values({
                id: loan.id,
                institutionId: loan.institutionId.value,
                staffId: loan.staffId,
                requestedByUserId: loan.requestedByUserId,
                status: loan.status,
                approvalStatus: loan.approvalStatus,
                purpose: loan.purpose,
                purposeDetails: loan.purposeDetails,
                notes: loan.notes,
                studentPickupNote: loan.studentPickupNote,
                loanDate: loan.loanDate,
                returnDate: loan.returnDate,
            }).onConflictDoUpdate({
                target: schema.loans.id,
                set: {
                    status: loan.status,
                    approvalStatus: loan.approvalStatus,
                    returnDate: loan.returnDate,
                    notes: loan.notes,
                },
            });

            if (loan.items.length > 0) {
                const existingCount = await tx.select({ count: sql<number>`count(*)` })
                    .from(schema.loanResources)
                    .where(eq(schema.loanResources.loanId, loan.id));

                if (Number(existingCount[0].count) === 0) {
                    const values = loan.items.map(resId => ({
                        id: crypto.randomUUID(),
                        loanId: loan.id,
                        resourceId: resId
                    }));
                    await tx.insert(schema.loanResources).values(values);
                }
            }
        });

        return loan;
    }

    async update(loan: Loan): Promise<Loan> {
        await this.db.update(schema.loans)
            .set({
                status: loan.status,
                approvalStatus: loan.approvalStatus,
                returnDate: loan.returnDate,
                notes: loan.notes,
                damageReports: loan.damageReports,
                suggestionReports: loan.suggestionReports,
                missingResources: loan.missingResources,
            })
            .where(eq(schema.loans.id, loan.id));
        return loan;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<Loan | null> {
        const result = await this.db.query.loans.findFirst({
            where: (loans, { eq, and }) => and(
                eq(loans.id, id),
                eq(loans.institutionId, institutionId.value)
            ),
            with: {
                loanResources: true
            }
        });

        if (!result) return null;

        const itemIds = result.loanResources.map(lr => lr.resourceId);
        return this.toDomain(result, itemIds);
    }

    async findAll(institutionId: InstitutionId): Promise<Loan[]> {
        const results = await this.db.query.loans.findMany({
            where: eq(schema.loans.institutionId, institutionId.value),
            with: {
                loanResources: true
            },
            orderBy: (loans, { desc }) => [desc(loans.loanDate)],
        });

        return results.map(r => this.toDomain(r, r.loanResources.map(lr => lr.resourceId)));
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        await this.db.transaction(async (tx) => {
            await tx.delete(schema.loanResources).where(eq(schema.loanResources.loanId, id));
            await tx.delete(schema.loans).where(and(
                eq(schema.loans.id, id),
                eq(schema.loans.institutionId, institutionId.value)
            ));
        });
        return true;
    }

    async findActiveByStaff(staffId: string, institutionId: InstitutionId): Promise<Loan[]> {
        const results = await this.db.query.loans.findMany({
            where: (loans, { eq, and }) => and(
                eq(loans.institutionId, institutionId.value),
                eq(loans.staffId, staffId),
                eq(loans.status, 'active')
            ),
            with: {
                loanResources: true
            }
        });
        return results.map(r => this.toDomain(r, r.loanResources.map(lr => lr.resourceId)));
    }
}
