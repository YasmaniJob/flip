import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceTemplateDto } from './create-resource-template.dto';

export class UpdateResourceTemplateDto extends PartialType(CreateResourceTemplateDto) { }
