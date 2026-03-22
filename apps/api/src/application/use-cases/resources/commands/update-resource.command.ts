import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';
import { UpdateResourceDto } from '../../../../infrastructure/http/dto/update-resource.dto';

import { Resource } from '../../../../core/domain/entities/resource.entity';

@Injectable()
export class UpdateResourceCommand {
    constructor(
        @Inject('IResourceRepository')
        private readonly resourceRepository: IResourceRepository,
    ) { }

    async execute(params: UpdateResourceDto & { institutionId: string; id: string }) {
        const { institutionId, id, ...updateData } = params;

        // Check if resource exists
        const resource = await this.resourceRepository.findById(id, institutionId);
        if (!resource) {
            throw new NotFoundException(`Resource with ID ${id} not found`);
        }

        // Update resource
        return this.resourceRepository.update(institutionId, id, updateData as Partial<Resource>);
    }
}
