import { CurricularArea } from '../../domain/entities/curricular-area.entity';
import { InstitutionId } from '@flip/shared';

export interface ICurricularAreaRepository {
    save(area: CurricularArea): Promise<CurricularArea>;
    findById(id: string, institutionId: InstitutionId): Promise<CurricularArea | null>;
    findAll(institutionId: InstitutionId): Promise<CurricularArea[]>;
    findByLevel(institutionId: InstitutionId, level: 'primaria' | 'secundaria'): Promise<CurricularArea[]>;
    findActive(institutionId: InstitutionId): Promise<CurricularArea[]>;
    update(area: CurricularArea): Promise<CurricularArea>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;
}
