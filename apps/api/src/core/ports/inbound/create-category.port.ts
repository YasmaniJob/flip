import { Category } from '../../domain/entities/category.entity';
import { InstitutionId } from '@flip/shared';

export interface CreateCategoryInput {
    institutionId: string;
    name: string;
    icon?: string;
    color?: string;
}

export interface CreateCategoryPort {
    execute(input: CreateCategoryInput): Promise<Category>;
}
