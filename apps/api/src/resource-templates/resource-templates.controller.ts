import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
// ResourcesService import removed as it is not used here and causing errors
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentInstitution } from '../common/decorators/current-institution.decorator';
import { ResourceTemplatesService } from './resource-templates.service';
import { CreateResourceTemplateDto } from './dto/create-resource-template.dto';
import { UpdateResourceTemplateDto } from './dto/update-resource-template.dto';
import { GetResourceTemplatesDto } from './dto/get-resource-templates.dto';

@Controller('resource-templates')
@UseGuards(AuthGuard)
export class ResourceTemplatesController {
    constructor(private readonly templatesService: ResourceTemplatesService) { }

    @Get()
    findAll(
        @CurrentInstitution() institutionId: string,
        @Query() query: GetResourceTemplatesDto,
    ) {
        return this.templatesService.findAll(institutionId, query, query.categoryId);
    }

    @Post()
    create(@CurrentInstitution() institutionId: string, @Body() createTemplateDto: CreateResourceTemplateDto) {
        return this.templatesService.create(institutionId, createTemplateDto);
    }

    @Put(':id')
    update(
        @CurrentInstitution() institutionId: string,
        @Param('id') id: string,
        @Body() updateTemplateDto: UpdateResourceTemplateDto,
    ) {
        return this.templatesService.update(institutionId, id, updateTemplateDto);
    }

    @Delete(':id')
    remove(@CurrentInstitution() institutionId: string, @Param('id') id: string) {
        return this.templatesService.remove(institutionId, id);
    }
}
