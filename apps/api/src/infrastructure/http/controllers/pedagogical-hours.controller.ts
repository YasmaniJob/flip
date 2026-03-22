import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Inject,
} from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { IPedagogicalHourRepository } from '../../../core/ports/outbound/pedagogical-hour.repository';
import { PedagogicalHour } from '../../../core/domain/entities/pedagogical-hour.entity';
import { InstitutionId, generateId } from '@flip/shared';

@Controller('pedagogical-hours')
@UseGuards(AuthGuard)
export class PedagogicalHoursController {
    constructor(
        @Inject('IPedagogicalHourRepository')
        private readonly repo: IPedagogicalHourRepository,
    ) { }

    @Get()
    async findAll(@CurrentTenant() institutionId: string) {
        const hours = await this.repo.findAll(InstitutionId.fromString(institutionId));
        return hours.map(h => ({
            id: h.id,
            name: h.name,
            startTime: h.startTime,
            endTime: h.endTime,
            sortOrder: h.sortOrder,
            isBreak: h.isBreak,
            active: h.active,
        }));
    }

    @Post()
    async create(
        @CurrentTenant() institutionId: string,
        @Body() body: { name: string; startTime: string; endTime: string; sortOrder?: number; isBreak?: boolean },
    ) {
        const hour = PedagogicalHour.create(
            generateId(),
            InstitutionId.fromString(institutionId),
            body.name,
            body.startTime,
            body.endTime,
            body.sortOrder ?? 0,
            body.isBreak ?? false,
        );
        return this.repo.save(hour);
    }

    @Put(':id')
    async update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() body: { name?: string; startTime?: string; endTime?: string; sortOrder?: number; isBreak?: boolean; active?: boolean },
    ) {
        const existing = await this.repo.findById(id, InstitutionId.fromString(institutionId));
        if (!existing) {
            throw new Error('Hora pedagógica no encontrada');
        }

        if (body.name !== undefined) existing.name = body.name;
        if (body.startTime !== undefined) existing.startTime = body.startTime;
        if (body.endTime !== undefined) existing.endTime = body.endTime;
        if (body.sortOrder !== undefined) existing.sortOrder = body.sortOrder;
        if (body.isBreak !== undefined) existing.isBreak = body.isBreak;
        if (body.active !== undefined) existing.active = body.active;

        return this.repo.update(existing);
    }

    @Delete(':id')
    async remove(@CurrentTenant() institutionId: string, @Param('id') id: string) {
        const deleted = await this.repo.delete(id, InstitutionId.fromString(institutionId));
        return { success: deleted };
    }
}
