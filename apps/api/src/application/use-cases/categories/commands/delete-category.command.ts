import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { InstitutionId } from '@flip/shared';

@Injectable()
export class DeleteCategoryCommand {
    constructor(
        @Inject('ICategoryRepository')
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async execute(institutionId: string, id: string): Promise<void> {
        const instId = InstitutionId.fromString(institutionId);
        const category = await this.categoryRepo.findById(id, instId);

        if (!category) {
            throw new NotFoundException('Categoría no encontrada');
        }

        const resourceCount = await this.categoryRepo.countResources(id);
        if (resourceCount > 0) {
            throw new ConflictException(`No se puede eliminar: ${resourceCount} recurso(s) usan esta categoría`);
        }

        await this.categoryRepo.delete(id, instId);
    }
}
