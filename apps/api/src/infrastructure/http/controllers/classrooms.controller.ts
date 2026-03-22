import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Inject, Req, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { DRIZZLE } from '../../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../../database/schema';
import { eq, and } from 'drizzle-orm';

@Controller('classrooms')
@UseGuards(AuthGuard)
export class ClassroomsController {
    constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

    @Get()
    async findAll(@CurrentTenant() institutionId: string) {
        return this.db.query.classrooms.findMany({
            where: eq(schema.classrooms.institutionId, institutionId),
            orderBy: (classrooms, { asc }) => [asc(classrooms.sortOrder), asc(classrooms.name)],
        });
    }

    @Post()
    async create(
        @CurrentTenant() institutionId: string,
        @Body() body: { name: string; code?: string; isPrimary?: boolean; sortOrder?: number },
    ) {
        const id = crypto.randomUUID();
        
        // If setting as primary, unset other primaries
        if (body.isPrimary) {
            await this.db
                .update(schema.classrooms)
                .set({ isPrimary: false })
                .where(eq(schema.classrooms.institutionId, institutionId));
        }

        await this.db.insert(schema.classrooms).values({
            id,
            institutionId,
            name: body.name,
            code: body.code,
            isPrimary: body.isPrimary ?? false,
            sortOrder: body.sortOrder ?? 0,
            active: true,
        });

        return this.db.query.classrooms.findFirst({ where: eq(schema.classrooms.id, id) });
    }

    @Put(':id')
    async update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() body: { name?: string; code?: string; isPrimary?: boolean; sortOrder?: number; active?: boolean },
    ) {
        // If setting as primary, unset other primaries
        if (body.isPrimary) {
            await this.db
                .update(schema.classrooms)
                .set({ isPrimary: false })
                .where(and(
                    eq(schema.classrooms.institutionId, institutionId),
                    eq(schema.classrooms.active, true),
                ));
        }

        await this.db
            .update(schema.classrooms)
            .set(body)
            .where(and(eq(schema.classrooms.id, id), eq(schema.classrooms.institutionId, institutionId)));

        return this.db.query.classrooms.findFirst({ where: eq(schema.classrooms.id, id) });
    }

    @Delete(':id')
    async delete(@CurrentTenant() institutionId: string, @Param('id') id: string) {
        // Soft delete
        await this.db
            .update(schema.classrooms)
            .set({ active: false })
            .where(and(eq(schema.classrooms.id, id), eq(schema.classrooms.institutionId, institutionId)));

        return { success: true };
    }
}
