import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from '../categories/categories.module';
import { ResourceController } from '../infrastructure/http/controllers/resource.controller';
import { DrizzleResourceRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-resource.repository';
import { CreateResourceCommand } from '../application/use-cases/resources/commands/create-resource.command';
import { CreateBatchResourcesCommand } from '../application/use-cases/resources/commands/create-batch-resources.command';
import { FindResourcesQuery } from '../application/use-cases/resources/queries/find-resources.query';
import { GetResourceStatsQuery } from '../application/use-cases/resources/queries/get-resource-stats.query';
import { UpdateResourceCommand } from '../application/use-cases/resources/commands/update-resource.command';
import { DeleteResourceCommand } from '../application/use-cases/resources/commands/delete-resource.command';

@Module({
    imports: [
        DatabaseModule,
        CategoriesModule, // Import to get ICategoryRepository
    ],
    controllers: [ResourceController],
    providers: [
        // Repository Provider
        {
            provide: 'IResourceRepository', // Use string token for interface injection
            useClass: DrizzleResourceRepository,
        },
        // Use Cases
        CreateResourceCommand,
        CreateBatchResourcesCommand,
        FindResourcesQuery,
        GetResourceStatsQuery,
        UpdateResourceCommand,
        DeleteResourceCommand,
    ],
    exports: [
        CreateResourceCommand,
        CreateBatchResourcesCommand,
        FindResourcesQuery,
        GetResourceStatsQuery,
        UpdateResourceCommand,
        DeleteResourceCommand,
        'IResourceRepository',
    ],
})
export class ResourceModule { }
