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
import { IGradeRepository } from '../../../core/ports/outbound/grade.repository';
import { Grade } from '../../../core/domain/entities/grade.entity';
import { InstitutionId, generateId } from '@flip/shared';

@Controller('grades')
@UseGuards(AuthGuard)
export class GradesController {
    constructor(
        @Inject('IGradeRepository')
        private readonly repo: IGradeRepository,
    ) { }

    @Get()
    async findAll(
        @CurrentTenant() institutionId: string,
        @Query('level') level?: 'primaria' | 'secundaria',
    ) {
        const instId = InstitutionId.fromString(institutionId);
        const grades = level
            ? await this.repo.findByLevel(instId, level)
            : await this.repo.findAll(instId);

        return grades.map(g => ({
            id: g.id,
            name: g.name,
            level: g.level,
            sortOrder: g.sortOrder,
        }));
    }

    @Post()
    async create(
        @CurrentTenant() institutionId: string,
        @Body() body: { name: string; level: 'primaria' | 'secundaria'; sortOrder?: number },
    ) {
        const grade = Grade.create(
            generateId(),
            InstitutionId.fromString(institutionId),
            body.name,
            body.level,
            body.sortOrder ?? 0,
        );
        return this.repo.save(grade);
    }

    @Put(':id')
    async update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() body: { name?: string; level?: 'primaria' | 'secundaria'; sortOrder?: number },
    ) {
        const existing = await this.repo.findById(id, InstitutionId.fromString(institutionId));
        if (!existing) {
            throw new BadRequestException('Grado no encontrado');
        }

        if (body.name !== undefined) existing.name = body.name;
        if (body.level !== undefined) existing.level = body.level;
        if (body.sortOrder !== undefined) existing.sortOrder = body.sortOrder;

        return this.repo.update(existing);
    }

    @Delete(':id')
    async remove(@CurrentTenant() institutionId: string, @Param('id') id: string) {
        const sectionCount = await this.repo.countSections(id);
        if (sectionCount > 0) {
            throw new BadRequestException(`No se puede eliminar: tiene ${sectionCount} sección(es) asociada(s)`);
        }

        const deleted = await this.repo.delete(id, InstitutionId.fromString(institutionId));
        return { success: deleted };
    }
}
