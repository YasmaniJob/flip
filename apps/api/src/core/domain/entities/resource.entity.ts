import { IResource } from '@flip/shared';
import { ResourceStatus, ResourceCondition, RESOURCE_STATUS, RESOURCE_CONDITION } from '@flip/shared';
import { InstitutionId, InternalId } from '@flip/shared';
import { randomUUID } from 'crypto';

export class Resource implements IResource {
    constructor(
        public readonly id: string,
        public readonly institutionId: string,
        public readonly internalId: string,
        public name: string,
        public status: ResourceStatus,
        public condition: ResourceCondition,
        public stock: number,
        public categoryId?: string,
        public templateId?: string,
        public brand?: string,
        public model?: string,
        public serialNumber?: string,
        public notes?: string,
        public attributes?: Record<string, any>,
        public maintenanceProgress?: number,
        public maintenanceState?: any,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) { }

    static create(props: {
        institutionId: string;
        internalId: string;
        name: string;
        categoryId?: string;
        templateId?: string;
        brand?: string;
        model?: string;
        serialNumber?: string;
        notes?: string;
        stock?: number;
        status?: ResourceStatus;
        condition?: ResourceCondition;
    }): Resource {
        return new Resource(
            randomUUID(),
            props.institutionId,
            props.internalId,
            props.name,
            props.status ?? RESOURCE_STATUS.DISPONIBLE,
            props.condition ?? RESOURCE_CONDITION.BUENO,
            props.stock ?? 1,
            props.categoryId,
            props.templateId,
            props.brand,
            props.model,
            props.serialNumber,
            props.notes,
            undefined,
            undefined, // maintenanceProgress
            undefined, // maintenanceState
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: IResource): Resource {
        return new Resource(
            props.id,
            props.institutionId,
            props.internalId,
            props.name,
            props.status,
            props.condition,
            props.stock,
            props.categoryId,
            props.templateId,
            props.brand,
            props.model,
            props.serialNumber,
            props.notes,
            props.attributes,
            props.maintenanceProgress,
            props.maintenanceState,
            props.createdAt,
            props.updatedAt,
        );
    }

    markAsBorrowed(): void {
        this.status = RESOURCE_STATUS.PRESTADO;
    }

    markAsAvailable(): void {
        this.status = RESOURCE_STATUS.DISPONIBLE;
    }

    markAsMaintenance(): void {
        this.status = RESOURCE_STATUS.MANTENIMIENTO;
    }

    markAsDecommissioned(): void {
        this.status = RESOURCE_STATUS.BAJA;
    }
}
