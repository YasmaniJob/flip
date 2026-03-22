import { Inject, Injectable } from '@nestjs/common';
import { FindLoansPort } from '../../../../core/ports/inbound/find-loans.port';
import { DRIZZLE } from '../../../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../../database/schema';
import { eq, desc, sql, inArray, and } from 'drizzle-orm';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { PaginatedResult } from '../../../../common/interfaces/paginated-result.interface';

type PurposeDetails = {
    gradeId?: string;
    sectionId?: string;
    curricularAreaId?: string;
};

@Injectable()
export class FindLoansQuery implements FindLoansPort {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    async execute(
        institutionId: string,
        pagination: PaginationDto,
        options?: { requestedByUserId?: string; userRole?: string }
    ): Promise<PaginatedResult<unknown>> {
        const { limit = 10, page = 1 } = pagination;
        const offset = (page - 1) * limit;

        // Docentes only see their own loans
        const isDocente = options?.userRole === 'docente';
        const baseWhere = isDocente && options?.requestedByUserId
            ? and(
                eq(schema.loans.institutionId, institutionId),
                eq(schema.loans.requestedByUserId, options.requestedByUserId)
            )
            : eq(schema.loans.institutionId, institutionId);

        const [loans, totalResult] = await Promise.all([
            this.db.query.loans.findMany({
                where: baseWhere,
                with: {
                    staff: true,
                    loanResources: {
                        with: {
                            resource: {
                                with: { category: true },
                            },
                        },
                    },
                },
                orderBy: (loans, { desc }) => [desc(loans.loanDate)],
                limit,
                offset,
            }),
            this.db
                .select({ count: sql<number>`count(*)` })
                .from(schema.loans)
                .where(baseWhere),
        ]);

        const total = Number(totalResult[0]?.count ?? 0);

        // Collect referenced IDs across all loans to resolve names in 3 targeted queries
        const details = loans.map(l => (l.purposeDetails ?? {}) as PurposeDetails);
        const gradeIds = [...new Set(details.map(d => d.gradeId).filter(Boolean))] as string[];
        const sectionIds = [...new Set(details.map(d => d.sectionId).filter(Boolean))] as string[];
        const areaIds = [...new Set(details.map(d => d.curricularAreaId).filter(Boolean))] as string[];

        const [grades, sections, areas] = await Promise.all([
            gradeIds.length > 0
                ? this.db.query.grades.findMany({ where: inArray(schema.grades.id, gradeIds) })
                : Promise.resolve([]),
            sectionIds.length > 0
                ? this.db.query.sections.findMany({ where: inArray(schema.sections.id, sectionIds) })
                : Promise.resolve([]),
            areaIds.length > 0
                ? this.db.query.curricularAreas.findMany({ where: inArray(schema.curricularAreas.id, areaIds) })
                : Promise.resolve([]),
        ]);

        const gradeMap = new Map(grades.map(g => [g.id, g.name]));
        const sectionMap = new Map(sections.map(s => [s.id, s.name]));
        const areaMap = new Map(areas.map(a => [a.id, a.name]));

        // Resolve user names for teacher-created loans (staffId=null, requestedByUserId set)
        const userIds = [...new Set(
            loans
                .filter(l => !l.staffId && (l as any).requestedByUserId)
                .map(l => (l as any).requestedByUserId as string)
        )];
        const usersResult = userIds.length > 0
            ? await this.db.query.users.findMany({ where: inArray(schema.users.id, userIds) })
            : [];
        const userMap = new Map(usersResult.map(u => [u.id, u.name]));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            data: loans.map(loan => {
                const loanDate = new Date(loan.loanDate ?? new Date());
                loanDate.setHours(0, 0, 0, 0);

                const d = (loan.purposeDetails ?? {}) as PurposeDetails;

                return {
                    id: loan.id,
                    institutionId: loan.institutionId,
                    staffId: loan.staffId,
                    requestedByUserId: (loan as any).requestedByUserId ?? null,
                    staffName: loan.staff?.name ?? ((loan as any).requestedByUserId ? userMap.get((loan as any).requestedByUserId) : undefined),
                    staffArea: loan.staff?.area,
                    status: loan.status === 'active' && loanDate < today ? 'overdue' : loan.status,
                    approvalStatus: (loan as any).approvalStatus ?? 'approved',
                    purpose: loan.purpose,
                    gradeName: d.gradeId ? gradeMap.get(d.gradeId) : undefined,
                    sectionName: d.sectionId ? sectionMap.get(d.sectionId) : undefined,
                    curricularAreaName: d.curricularAreaId ? areaMap.get(d.curricularAreaId) : undefined,
                    notes: loan.notes,
                    studentPickupNote: (loan as any).studentPickupNote ?? null,
                    loanDate: loan.loanDate,
                    returnDate: loan.returnDate,
                    items: loan.loanResources.map(lr => lr.resourceId),
                    resourceNames: loan.loanResources.map(lr => lr.resource?.name).filter(Boolean),
                    resources: loan.loanResources.map(lr => ({
                        id: lr.resource.id,
                        name: lr.resource.name,
                        brand: lr.resource.brand,
                        model: lr.resource.model,
                        status: lr.resource.status,
                        internalId: lr.resource.internalId,
                        category: lr.resource.category
                            ? { name: lr.resource.category.name, color: lr.resource.category.color }
                            : undefined,
                    })),
                    damageReports: loan.damageReports,
                    suggestionReports: loan.suggestionReports,
                };
            }),
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            },
        };
    }
}
