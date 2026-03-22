import { Inject, Injectable } from '@nestjs/common';
import { CreateResourceInput, CreateResourcePort } from '../../../../core/ports/inbound/create-resource.port';
import { Resource } from '../../../../core/domain/entities/resource.entity';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';
import { ICategoryRepository } from '../../../../core/ports/outbound/category.repository';
import { InternalId, InstitutionId } from '@flip/shared';

@Injectable()
export class CreateResourceCommand implements CreateResourcePort {
    constructor(
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
        @Inject('ICategoryRepository')
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async execute(input: CreateResourceInput): Promise<Resource> {
        let prefix = 'REC';

        if (input.categoryId) {
            const category = await this.categoryRepo.findById(input.categoryId, InstitutionId.fromString(input.institutionId));
            if (category) {
                prefix = InternalId.generatePrefix(category.name);
            }
        }

        const nextNumber = await this.resourceRepo.getNextSequence(input.institutionId, prefix);
        const internalId = InternalId.create(prefix, nextNumber);

        const resource = Resource.create({
            institutionId: input.institutionId,
            internalId: internalId.toString(),
            name: input.name,
            categoryId: input.categoryId,
            templateId: input.templateId,
            brand: input.brand,
            model: input.model,
            serialNumber: input.serialNumber,
            notes: input.notes,
            stock: input.stock,
        });

        // If reusing the same logic for batch, we might loop here, but for now single creation
        return this.resourceRepo.save(resource);
    }
}
