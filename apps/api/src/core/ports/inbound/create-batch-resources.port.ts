import { Resource } from '../../domain/entities/resource.entity';
import { CreateResourceInput } from './create-resource.port';

export interface CreateBatchResourcesInput {
    institutionId: string;
    resource: Omit<CreateResourceInput, 'institutionId'>;
    quantity: number;
    items?: { serialNumber?: string; condition?: string; status?: string }[];
}

export interface CreateBatchResourcesPort {
    execute(input: CreateBatchResourcesInput): Promise<Resource[]>;
}
