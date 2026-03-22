import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';

@Injectable()
export class DeleteResourceCommand {
    constructor(
        @Inject('IResourceRepository')
        private readonly resourceRepository: IResourceRepository,
    ) { }

    async execute(institutionId: string, id: string) {
        // Check if resource exists
        const resource = await this.resourceRepository.findById(id, institutionId);
        if (!resource) {
            throw new NotFoundException(`Resource with ID ${id} not found`);
        }

        await this.resourceRepository.delete(id, institutionId);
    }
}
