import { Section } from '../../domain/entities/section.entity';
import { InstitutionId } from '@flip/shared';

export interface ISectionRepository {
    save(section: Section): Promise<Section>;
    findById(id: string, institutionId: InstitutionId): Promise<Section | null>;
    findAll(institutionId: InstitutionId): Promise<Section[]>;
    findByGrade(institutionId: InstitutionId, gradeId: string): Promise<Section[]>;
    update(section: Section): Promise<Section>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;
}
