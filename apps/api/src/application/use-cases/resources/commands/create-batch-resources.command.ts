import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CreateBatchResourcesInput, CreateBatchResourcesPort } from '../../../../core/ports/inbound/create-batch-resources.port';
import { Resource } from '../../../../core/domain/entities/resource.entity';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { InternalId, InstitutionId } from '@flip/shared';

@Injectable()
export class CreateBatchResourcesCommand implements CreateBatchResourcesPort {
    constructor(
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
        @Inject('ICategoryRepository')
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async execute(input: CreateBatchResourcesInput): Promise<Resource[]> {
        const { institutionId, resource: resourceDto, quantity, items } = input;

        if (quantity < 1 || quantity > 100) {
            throw new BadRequestException('La cantidad debe estar entre 1 y 100');
        }

        let prefix = 'REC';
        if (resourceDto.categoryId) {
            const category = await this.categoryRepo.findById(resourceDto.categoryId, InstitutionId.fromString(institutionId));
            if (category) {
                prefix = InternalId.generatePrefix(category.name);
            }
        }

        const resources: Resource[] = [];

        // Loop to create each resource with its own internal ID
        for (let i = 0; i < quantity; i++) {
            const nextNumber = await this.resourceRepo.getNextSequence(institutionId, prefix);
            const internalId = InternalId.create(prefix, nextNumber);
            const item = items?.[i];

            const resource = Resource.create({
                institutionId,
                internalId: internalId.toString(),
                name: resourceDto.name,
                categoryId: resourceDto.categoryId,
                templateId: resourceDto.templateId,
                brand: resourceDto.brand,
                model: resourceDto.model,
                serialNumber: item?.serialNumber || undefined,
                notes: resourceDto.notes,
                stock: 1, // Individual stock for batch items
                condition: (item?.condition as any) || resourceDto.condition || 'bueno',
                status: (item?.status as any) || resourceDto.status || 'disponible',
            });

            const saved = await this.resourceRepo.save(resource);
            resources.push(saved);
        }

        return resources;
    }
}
