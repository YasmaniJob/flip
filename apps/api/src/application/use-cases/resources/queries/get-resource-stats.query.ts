import { Inject, Injectable } from '@nestjs/common';
import { GetResourceStatsPort, ResourceStats } from '../../../../core/ports/inbound/get-resource-stats.port';
import { IResourceRepository } from '../../../../core/ports/outbound/resource.repository';

@Injectable()
export class GetResourceStatsQuery implements GetResourceStatsPort {
    constructor(
        @Inject('IResourceRepository')
        private readonly resourceRepo: IResourceRepository,
    ) { }

    async execute(institutionId: string): Promise<ResourceStats> {
        return this.resourceRepo.getStats(institutionId);
    }
}
