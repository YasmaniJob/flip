import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Inject,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { ISectionRepository } from '../../../core/ports/outbound/section.repository';
import { Section } from '../../../core/domain/entities/section.entity';
import { InstitutionId, generateId } from '@flip/shared';

@Controller('sections')
@UseGuards(AuthGuard)
export class SectionsController {
    constructor(
        @Inject('ISectionRepository')
        private readonly repo: ISectionRepository,
    ) { }

    @Get()
    async findAll(
        @CurrentTenant() institutionId: string,
        @Query('gradeId') gradeId?: string,
    ) {
        const instId = InstitutionId.fromString(institutionId);
        const sections = gradeId
            ? await this.repo.findByGrade(instId, gradeId)
            : await this.repo.findAll(instId);

        return sections.map(s => ({
            id: s.id,
            name: s.name,
            gradeId: s.gradeId,
            studentCount: s.studentCount,
        }));
    }

    @Post()
    async create(
        @CurrentTenant() institutionId: string,
        @Body() body: { name: string; gradeId: string; studentCount?: number },
    ) {
        const section = Section.create(
            generateId(),
            InstitutionId.fromString(institutionId),
            body.name,
            body.gradeId,
            body.studentCount,
        );
        return this.repo.save(section);
    }

    @Put(':id')
    async update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() body: { name?: string; gradeId?: string; studentCount?: number },
    ) {
        const existing = await this.repo.findById(id, InstitutionId.fromString(institutionId));
        if (!existing) {
            throw new BadRequestException('Sección no encontrada');
        }

        if (body.name !== undefined) existing.name = body.name;
        if (body.gradeId !== undefined) existing.gradeId = body.gradeId;
        if (body.studentCount !== undefined) existing.studentCount = body.studentCount;

        return this.repo.update(existing);
    }

    @Delete(':id')
    async remove(@CurrentTenant() institutionId: string, @Param('id') id: string) {
        try {
            const deleted = await this.repo.delete(id, InstitutionId.fromString(institutionId));
            return { success: deleted };
        } catch (error: any) {
            throw new BadRequestException(error.message || 'Error al eliminar la sección');
        }
    }
}
