import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetResourceTemplatesDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Filter by category ID',
    })
    @IsString()
    @IsOptional()
    categoryId?: string;
}
