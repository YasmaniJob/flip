import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    Header,
    Query,
} from '@nestjs/common';
import { UsePipes } from '@nestjs/common';
import { AuthGuard } from '../../../auth/auth.guard';
import { CreateCategoryDto } from '../../../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../../categories/dto/update-category.dto';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { createCategorySchema, updateCategorySchema } from '@flip/shared';
import { CreateCategoryCommand } from '../../../application/use-cases/categories/commands/create-category.command';
import { FindCategoriesQuery } from '../../../application/use-cases/categories/queries/find-categories.query';
import { UpdateCategoryCommand } from '../../../application/use-cases/categories/commands/update-category.command';
import { DeleteCategoryCommand } from '../../../application/use-cases/categories/commands/delete-category.command';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { ResourceTemplatesService } from '../../../resource-templates/resource-templates.service';
import { DEFAULT_TEMPLATES } from '../../../resource-templates/constants/default-templates.const';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
    constructor(
        private readonly createCategory: CreateCategoryCommand,
        private readonly findCategories: FindCategoriesQuery,
        private readonly updateCategory: UpdateCategoryCommand,
        private readonly deleteCategory: DeleteCategoryCommand,
        private readonly resourceTemplatesService: ResourceTemplatesService,
    ) { }

    @Get()
    findAll(
        @CurrentTenant() institutionId: string,
        @Query('has_resources') hasResources?: string,
    ) {
        return this.findCategories.execute(institutionId, {
            hasResources: hasResources === 'true'
        });
    }

    @Post()
    @UsePipes(new ZodValidationPipe(createCategorySchema))
    async create(@CurrentTenant() institutionId: string, @Body() createCategoryDto: CreateCategoryDto) {
        // 1. Create the category
        const category = await this.createCategory.execute({
            institutionId,
            ...createCategoryDto
        });

        // 2. Auto-seed default templates if they exist for this category name
        const defaultTemplates = DEFAULT_TEMPLATES[category.name];
        if (defaultTemplates && defaultTemplates.length > 0) {
            try {
                // Ensure idempotency: create templates only if they don't already exist
                // (usually empty on fresh creation, but good practice)
                const existingTemplates = await this.resourceTemplatesService.findAll(institutionId, { limit: 100, page: 1 } as any, category.id);

                for (const temp of defaultTemplates) {
                    const exists = existingTemplates.data.some((t: any) => t.name === temp.name);
                    if (!exists) {
                        await this.resourceTemplatesService.create(institutionId, {
                            categoryId: category.id,
                            name: temp.name,
                            icon: temp.icon,
                            isDefault: true,
                            sortOrder: 0,
                        });
                    }
                }
            } catch (error) {
                console.error(`Error auto-seeding templates for category ${category.name}:`, error);
                // Non-blocking error: category is created, even if template seeding fails
            }
        }

        return category;
    }

    @Put(':id')
    @UsePipes(new ZodValidationPipe(updateCategorySchema))
    update(
        @CurrentTenant() institutionId: string,
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        return this.updateCategory.execute(institutionId, id, updateCategoryDto);
    }



    @Delete(':id')
    remove(@CurrentTenant() institutionId: string, @Param('id') id: string) {
        return this.deleteCategory.execute(institutionId, id);
    }
}
