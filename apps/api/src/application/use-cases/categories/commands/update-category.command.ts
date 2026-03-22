import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { InstitutionId } from '@flip/shared';
import { Category } from '../../../../core/domain/entities/category.entity';

export interface UpdateCategoryInput {
    name?: string;
    icon?: string;
    color?: string;
}

@Injectable()
export class UpdateCategoryCommand {
    constructor(
        @Inject('ICategoryRepository')
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async execute(institutionId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
        const instId = InstitutionId.fromString(institutionId);
        const category = await this.categoryRepo.findById(id, instId);

        if (!category) {
            throw new NotFoundException('Categoría no encontrada');
        }

        category.name = input.name ?? category.name;
        category.icon = input.icon ?? category.icon;
        category.color = input.color ?? category.color;

        return this.categoryRepo.update(category);
    }
}
