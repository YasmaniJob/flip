import { Controller, Post, Get, Put, Delete, Body, Query, Param, UseGuards, NotFoundException, HttpCode } from '@nestjs/common';
import { CreateResourceCommand } from '../../../application/use-cases/resources/commands/create-resource.command';
import { CreateBatchResourcesCommand } from '../../../application/use-cases/resources/commands/create-batch-resources.command';
import { FindResourcesQuery } from '../../../application/use-cases/resources/queries/find-resources.query';
import { GetResourceStatsQuery } from '../../../application/use-cases/resources/queries/get-resource-stats.query';
import { UpdateResourceCommand } from '../../../application/use-cases/resources/commands/update-resource.command';
import { DeleteResourceCommand } from '../../../application/use-cases/resources/commands/delete-resource.command';
import { CreateResourceDto } from '../dto/create-resource.dto';
import { UpdateResourceDto } from '../dto/update-resource.dto';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { DRIZZLE } from '../../../database/database.module';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../database/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';

@Controller('resources')
@UseGuards(AuthGuard)
export class ResourceController {
    constructor(
        private readonly createResource: CreateResourceCommand,
        private readonly createBatchResources: CreateBatchResourcesCommand,
        private readonly findResources: FindResourcesQuery,
        private readonly getResourceStats: GetResourceStatsQuery,
        private readonly updateResource: UpdateResourceCommand,
        private readonly deleteResource: DeleteResourceCommand,
        @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    @Post()
    async create(@CurrentTenant() institutionId: string, @Body() dto: CreateResourceDto) {
        return this.createResource.execute({
            ...dto,
            institutionId,
        });
    }

    @Put(':id')
    async update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() dto: UpdateResourceDto,
    ) {
        return this.updateResource.execute({
            ...dto,
            institutionId,
            id,
        });
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
    ) {
        await this.deleteResource.execute(institutionId, id);
    }

    @Post('batch')
    async createBatch(
        @CurrentTenant() institutionId: string,
        @Body() body: {
            resource: CreateResourceDto;
            quantity: number;
            items?: { serialNumber?: string; condition?: string; status?: string }[];
        }
    ) {
        return this.createBatchResources.execute({
            institutionId,
            resource: body.resource,
            quantity: body.quantity,
            items: body.items,
        });
    }

    @Get()
    async findAll(@CurrentTenant() institutionId: string, @Query() query: any) {
        return this.findResources.execute({
            institutionId,
            search: query.search,
            categoryId: query.categoryId,
            status: query.status,
            condition: query.condition,
        });
    }

    @Get('stats')
    async getStats(@CurrentTenant() institutionId: string) {
        return this.getResourceStats.execute(institutionId);
    }

    @Get(':resourceId/last-damage-report')
    async getLastDamageReport(
        @CurrentTenant() institutionId: string,
        @Param('resourceId') resourceId: string,
    ) {
        // Find the most recent returned loan that contains this resource and has damage reports
        const loanResourceRows = await this.db
            .select({ loanId: schema.loanResources.loanId })
            .from(schema.loanResources)
            .where(eq(schema.loanResources.resourceId, resourceId));

        if (loanResourceRows.length === 0) return null;

        const loanIds = loanResourceRows.map(r => r.loanId);

        const loan = await this.db.query.loans.findFirst({
            where: (loans, { and, inArray, eq, isNotNull }) => and(
                eq(loans.institutionId, institutionId),
                inArray(loans.id, loanIds),
                eq(loans.status, 'returned'),
                isNotNull(loans.damageReports),
            ),
            with: { staff: true },
            orderBy: (loans, { desc }) => [desc(loans.returnDate)],
        });

        if (!loan) return null;

        const reports = loan.damageReports as Record<string, any> | null;
        if (!reports) return null;

        // damageReports is { [resourceId]: { commonProblems: string[], otherNotes?: string } }
        const resourceReport = reports[resourceId];
        const damages: string[] = resourceReport?.commonProblems ?? [];
        const damageNotes: string = resourceReport?.otherNotes ?? '';

        // suggestionReports is { [resourceId]: { commonSuggestions: string[], otherNotes?: string } }
        const suggestionData = (loan.suggestionReports as Record<string, any> | null)?.[resourceId];
        const suggestions: string[] = [
            ...(suggestionData?.commonSuggestions ?? []),
            ...(suggestionData?.otherNotes ? [suggestionData.otherNotes] : []),
        ];

        if (damages.length === 0 && !damageNotes && suggestions.length === 0) return null;

        const allDamages = damageNotes ? [...damages, damageNotes] : damages;

        if (damages.length === 0 && suggestions.length === 0) return null;

        // Resolve reporter name
        let reportedBy = loan.staff?.name ?? 'Desconocido';
        if (!loan.staffId && (loan as any).requestedByUserId) {
            const user = await this.db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, (loan as any).requestedByUserId),
            });
            if (user) reportedBy = user.name;
        }

        return {
            loanId: loan.id,
            reportDate: loan.returnDate ?? loan.loanDate,
            reportedBy,
            damages: allDamages,
            suggestions,
        };
    }
}
