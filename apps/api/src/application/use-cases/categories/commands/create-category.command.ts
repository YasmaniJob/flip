import { Inject, Injectable } from '@nestjs/common';
import { CreateCategoryPort, CreateCategoryInput } from '../../../../core/ports/inbound/create-category.port';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { Category } from '../../../../core/domain/entities/category.entity';
import { InstitutionId, generateId } from '@flip/shared';

@Injectable()
export class CreateCategoryCommand implements CreateCategoryPort {
    constructor(
        @Inject('ICategoryRepository')
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async execute(input: CreateCategoryInput): Promise<Category> {
        // Validation could happen here or in Entity
        // Using generateId() from shared, assuming it's cuid or similar
        const category = Category.create(
            generateId(),
            InstitutionId.fromString(input.institutionId),
            input.name,
            input.icon,
            input.color
        );
        return this.categoryRepo.save(category);
    }
}
