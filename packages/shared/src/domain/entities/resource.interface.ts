import { ResourceStatus, ResourceCondition } from '../../constants';

export interface IResource {
    id: string;
    institutionId: string;
    categoryId?: string;
    templateId?: string;
    internalId: string;
    name: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    status: ResourceStatus;
    condition: ResourceCondition;
    stock: number;
    notes?: string;
    maintenanceProgress?: number;
    maintenanceState?: any;
    attributes?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
