import { Category } from '../../domain/entities/category.entity';
import { InstitutionId } from '@flip/shared';

export interface FindCategoriesPort {
    execute(institutionId: string, options?: { hasResources?: boolean }): Promise<Category[]>;
}
