import { Module } from '@nestjs/common';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from '../categories/categories.module';
import { ResourceTemplatesModule } from '../resource-templates/resource-templates.module';

@Module({
    imports: [
        DatabaseModule,
        CategoriesModule, // Import to inject CategoriesService
        ResourceTemplatesModule,
    ],
    controllers: [InstitutionsController],
    providers: [InstitutionsService],
    exports: [InstitutionsService],
})
export class InstitutionsModule { }
