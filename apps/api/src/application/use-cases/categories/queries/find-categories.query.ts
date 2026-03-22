import { Inject, Injectable } from '@nestjs/common';
import { FindCategoriesPort } from '../../../../core/ports/inbound/find-categories.port';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { Category } from '../../../../core/domain/entities/category.entity';
import { InstitutionId } from '@flip/shared';

@Injectable()
export class FindCategoriesQuery implements FindCategoriesPort {
    constructor(
        @Inject('ICategoryRepository')
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async execute(institutionId: string, options?: { hasResources?: boolean }): Promise<Category[]> {
        return this.categoryRepo.findAll(InstitutionId.fromString(institutionId), options);
    }
}
