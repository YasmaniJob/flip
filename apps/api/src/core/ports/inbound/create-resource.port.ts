import { Resource } from '../../domain/entities/resource.entity';

export interface CreateResourceInput {
    institutionId: string;
    name: string;
    categoryId?: string;
    templateId?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    condition?: string;
    status?: string;
    notes?: string;
    stock?: number;
}

export interface CreateResourcePort {
    execute(input: CreateResourceInput): Promise<Resource>;
}
