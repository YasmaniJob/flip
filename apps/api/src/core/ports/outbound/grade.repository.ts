import { Grade } from '../../domain/entities/grade.entity';
import { InstitutionId } from '@flip/shared';

export interface IGradeRepository {
    save(grade: Grade): Promise<Grade>;
    findById(id: string, institutionId: InstitutionId): Promise<Grade | null>;
    findAll(institutionId: InstitutionId): Promise<Grade[]>;
    findByLevel(institutionId: InstitutionId, level: 'primaria' | 'secundaria'): Promise<Grade[]>;
    update(grade: Grade): Promise<Grade>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;
    countSections(id: string): Promise<number>;
}
