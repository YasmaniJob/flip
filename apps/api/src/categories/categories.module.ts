import { Module } from '@nestjs/common';
import { CategoriesController } from '../infrastructure/http/controllers/category.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzleCategoryRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-category.repository';
import { CreateCategoryCommand } from '../application/use-cases/categories/commands/create-category.command';
import { UpdateCategoryCommand } from '../application/use-cases/categories/commands/update-category.command';
import { DeleteCategoryCommand } from '../application/use-cases/categories/commands/delete-category.command';
import { FindCategoriesQuery } from '../application/use-cases/categories/queries/find-categories.query';
import { ResourceTemplatesModule } from '../resource-templates/resource-templates.module';


@Module({
    imports: [DatabaseModule, ResourceTemplatesModule],
    controllers: [CategoriesController],
    providers: [
        {
            provide: 'ICategoryRepository',
            useClass: DrizzleCategoryRepository,
        },
        CreateCategoryCommand,
        UpdateCategoryCommand,
        DeleteCategoryCommand,
        FindCategoriesQuery,
    ],
    exports: ['ICategoryRepository', CreateCategoryCommand],
})
export class CategoriesModule { }
