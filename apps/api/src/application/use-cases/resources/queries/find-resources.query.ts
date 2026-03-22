import { Inject, Injectable } from '@nestjs/common';
import { FindResourcesInput, FindResourcesPort } from '../../../../core/ports/inbound/find-resources.port';
import { Resource } from '../../../../core/domain/entities/resource.entity';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';

@Injectable()
export class FindResourcesQuery implements FindResourcesPort {
    constructor(
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
    ) { }

    async execute(input: FindResourcesInput): Promise<Resource[]> {
        return this.resourceRepo.findAll(input.institutionId, {
            search: input.search,
            categoryId: input.categoryId,
            status: input.status,
            condition: input.condition,
        });
    }

    async executeById(id: string, institutionId: string): Promise<Resource | null> {
        return this.resourceRepo.findById(id, institutionId);
    }
}
