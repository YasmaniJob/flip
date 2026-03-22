import { Resource } from '../../domain/entities/resource.entity';

export interface IResourceRepository {
    save(resource: Resource): Promise<Resource>;
    findById(id: string, institutionId: string): Promise<Resource | null>;
    findManyByIds(institutionId: string, ids: string[]): Promise<Resource[]>;
    findAll(institutionId: string, filters?: {
        search?: string;
        categoryId?: string;
        status?: string;
        condition?: string;
    }): Promise<Resource[]>;
    delete(id: string, institutionId: string): Promise<void>;
    update(institutionId: string, id: string, data: Partial<Resource>): Promise<Resource>;
    updateManyStatus(institutionId: string, ids: string[], status: string): Promise<void>;
    getNextSequence(institutionId: string, prefix: string): Promise<number>;
    getStats(institutionId: string): Promise<{
        total: number;
        disponible: number;
        prestado: number;
        mantenimiento: number;
        baja: number;
    }>;
}
