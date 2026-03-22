import { Category } from '../../domain/entities/category.entity';
import { InstitutionId } from '@flip/shared';

export interface ICategoryRepository {
    save(category: Category): Promise<Category>;
    findById(id: string, institutionId: InstitutionId): Promise<Category | null>;
    findAll(institutionId: InstitutionId, options?: { hasResources?: boolean }): Promise<Category[]>;
    update(category: Category): Promise<Category>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;
    findByName(name: string, institutionId: InstitutionId): Promise<Category | null>;
    countResources(id: string): Promise<number>;
}
