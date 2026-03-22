import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, ne, and, sql, count } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class DashboardService {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    /**
     * Platform-wide stats for SuperAdmin
     */
    async getSuperAdminStats() {
        const [
            totalInstitutions,
            totalUsers,
            totalResources,
            totalLoans,
            activeLoans,
            overdueLoans,
        ] = await Promise.all([
            this.db.select({ count: count() }).from(schema.institutions),
            this.db.select({ count: count() }).from(schema.users)
                .where(ne(schema.users.isSuperAdmin, true)),
            this.db.select({ count: count() }).from(schema.resources),
            this.db.select({ count: count() }).from(schema.loans),
            this.db.select({ count: count() }).from(schema.loans)
                .where(eq(schema.loans.status, 'active')),
            this.db.select({ count: count() }).from(schema.loans)
                .where(eq(schema.loans.status, 'overdue')),
        ]);

        // Recent institutions (last 5)
        const recentInstitutions = await this.db
            .select({
                id: schema.institutions.id,
                name: schema.institutions.name,
                nivel: schema.institutions.nivel,
                plan: schema.institutions.plan,
                createdAt: schema.institutions.createdAt,
            })
            .from(schema.institutions)
            .orderBy(sql`${schema.institutions.createdAt} DESC`)
            .limit(5);

        return {
            platform: {
                totalInstitutions: totalInstitutions[0].count,
                totalUsers: totalUsers[0].count,
                totalResources: totalResources[0].count,
                totalLoans: totalLoans[0].count,
                activeLoans: activeLoans[0].count,
                overdueLoans: overdueLoans[0].count,
            },
            recentInstitutions,
        };
    }

    /**
     * Institution-level stats for regular users (AIP / Admin)
     */
    async getInstitutionStats(institutionId: string) {
        const [
            totalStaff,
            totalResources,
            availableResources,
            activeLoans,
            overdueLoans,
            totalMeetings,
        ] = await Promise.all([
            this.db.select({ count: count() }).from(schema.staff)
                .where(and(
                    eq(schema.staff.institutionId, institutionId),
                    eq(schema.staff.status, 'active')
                )),
            this.db.select({ count: count() }).from(schema.resources)
                .where(eq(schema.resources.institutionId, institutionId)),
            this.db.select({ count: count() }).from(schema.resources)
                .where(and(
                    eq(schema.resources.institutionId, institutionId),
                    eq(schema.resources.status, 'disponible')
                )),
            this.db.select({ count: count() }).from(schema.loans)
                .where(and(
                    eq(schema.loans.institutionId, institutionId),
                    eq(schema.loans.status, 'active')
                )),
            this.db.select({ count: count() }).from(schema.loans)
                .where(and(
                    eq(schema.loans.institutionId, institutionId),
                    eq(schema.loans.status, 'overdue')
                )),
            this.db.select({ count: count() }).from(schema.meetings)
                .where(eq(schema.meetings.institutionId, institutionId)),
        ]);

        return {
            institution: {
                totalStaff: totalStaff[0].count,
                totalResources: totalResources[0].count,
                availableResources: availableResources[0].count,
                activeLoans: activeLoans[0].count,
                overdueLoans: overdueLoans[0].count,
                totalMeetings: totalMeetings[0].count,
            }
        };
    }
}
