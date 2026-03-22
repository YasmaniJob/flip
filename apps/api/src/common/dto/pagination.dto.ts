import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({
        minimum: 1,
        default: 1,
        description: 'Page number',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({
        minimum: 1,
        maximum: 1000,
        default: 10,
        description: 'Items per page',
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(1000)
    @IsOptional()
    limit?: number = 10;

    get offset(): number {
        return ((this.page || 1) - 1) * (this.limit || 10);
    }
}
