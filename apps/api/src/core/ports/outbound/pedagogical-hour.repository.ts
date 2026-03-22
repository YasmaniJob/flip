import { PedagogicalHour } from '../../domain/entities/pedagogical-hour.entity';
import { InstitutionId } from '@flip/shared';

export interface IPedagogicalHourRepository {
    save(pedagogicalHour: PedagogicalHour): Promise<PedagogicalHour>;
    findById(id: string, institutionId: InstitutionId): Promise<PedagogicalHour | null>;
    findAll(institutionId: InstitutionId): Promise<PedagogicalHour[]>;
    update(pedagogicalHour: PedagogicalHour): Promise<PedagogicalHour>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;
}
