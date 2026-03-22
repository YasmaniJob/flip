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
import { ICurricularAreaRepository } from '../../../core/ports/outbound/curricular-area.repository';
import { CurricularArea } from '../../../core/domain/entities/curricular-area.entity';
import { InstitutionId, generateId } from '@flip/shared';

@Controller('curricular-areas')
@UseGuards(AuthGuard)
export class CurricularAreasController {
    constructor(
        @Inject('ICurricularAreaRepository')
        private readonly repo: ICurricularAreaRepository,
    ) { }

    @Get()
    async findAll(
        @CurrentTenant() institutionId: string,
        @Query('level') level?: 'primaria' | 'secundaria',
        @Query('active') activeOnly?: string,
    ) {
        const instId = InstitutionId.fromString(institutionId);

        let areas: CurricularArea[];
        if (activeOnly === 'true') {
            areas = await this.repo.findActive(instId);
        } else if (level) {
            areas = await this.repo.findByLevel(instId, level);
        } else {
            areas = await this.repo.findAll(instId);
        }

        return areas.map(a => ({
            id: a.id,
            name: a.name,
            levels: a.levels,
            isStandard: a.isStandard,
            active: a.active,
        }));
    }

    @Post()
    async create(
        @CurrentTenant() institutionId: string,
        @Body() body: { name: string; levels?: ('primaria' | 'secundaria')[]; isStandard?: boolean },
    ) {
        const area = CurricularArea.create(
            generateId(),
            InstitutionId.fromString(institutionId),
            body.name,
            body.levels,
            body.isStandard ?? false,
        );
        return this.repo.save(area);
    }

    @Put(':id')
    async update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() body: { name?: string; levels?: ('primaria' | 'secundaria')[]; active?: boolean },
    ) {
        const existing = await this.repo.findById(id, InstitutionId.fromString(institutionId));
        if (!existing) {
            throw new BadRequestException('Área curricular no encontrada');
        }

        if (body.name !== undefined) existing.name = body.name;
        if (body.levels !== undefined) existing.levels = body.levels;
        if (body.active !== undefined) existing.active = body.active;

        return this.repo.update(existing);
    }

    @Delete(':id')
    async remove(@CurrentTenant() institutionId: string, @Param('id') id: string) {
        const deleted = await this.repo.delete(id, InstitutionId.fromString(institutionId));
        return { success: deleted };
    }

    @Post('seed-standard')
    async seedStandard(
        @CurrentTenant() institutionId: string,
        @Body() body: { selectedAreas?: string[] }
    ) {
        // Seed standard CNEB areas for Peru
        const standardAreas = [
            { name: 'Matemática', levels: ['primaria', 'secundaria'] as const },
            { name: 'Comunicación', levels: ['primaria', 'secundaria'] as const },
            { name: 'Ciencia y Tecnología', levels: ['primaria', 'secundaria'] as const },
            { name: 'Personal Social', levels: ['primaria'] as const },
            { name: 'Desarrollo Personal, Ciudadanía y Cívica', levels: ['secundaria'] as const },
            { name: 'Ciencias Sociales', levels: ['secundaria'] as const },
            { name: 'Arte y Cultura', levels: ['primaria', 'secundaria'] as const },
            { name: 'Educación Física', levels: ['primaria', 'secundaria'] as const },
            { name: 'Educación Religiosa', levels: ['primaria', 'secundaria'] as const },
            { name: 'Inglés', levels: ['primaria', 'secundaria'] as const },
            { name: 'Educación para el Trabajo', levels: ['secundaria'] as const },
            { name: 'Tutoría', levels: ['primaria', 'secundaria'] as const },
        ];

        const instId = InstitutionId.fromString(institutionId);

        // 1. Get existing areas to prevent duplicates
        const existingAreas = await this.repo.findAll(instId);
        const existingNames = new Set(existingAreas.map(a => a.name.toLowerCase().trim()));

        // 2. Filter areas to create
        const areasToCreate = standardAreas.filter(std => {
            // If specific selection is provided, allow only those. Otherwise all (legacy behavior).
            if (body.selectedAreas && body.selectedAreas.length > 0) {
                if (!body.selectedAreas.includes(std.name)) return false;
            }
            // Exclude if already exists
            return !existingNames.has(std.name.toLowerCase().trim());
        });

        const created: CurricularArea[] = [];

        for (const areaData of areasToCreate) {
            const area = CurricularArea.create(
                generateId(),
                instId,
                areaData.name,
                [...areaData.levels],
                true, // isStandard
            );
            await this.repo.save(area);
            created.push(area);
        }

        return { message: 'Áreas importadas correctamente', count: created.length };
    }
}
