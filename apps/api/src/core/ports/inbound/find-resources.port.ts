import { Resource } from '../../domain/entities/resource.entity';

export interface FindResourcesInput {
    institutionId: string;
    search?: string;
    categoryId?: string;
    status?: string;
    condition?: string;
}

export interface FindResourcesPort {
    execute(input: FindResourcesInput): Promise<Resource[]>;
    executeById(id: string, institutionId: string): Promise<Resource | null>;
}
