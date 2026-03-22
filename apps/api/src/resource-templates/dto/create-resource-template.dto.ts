import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateResourceTemplateDto {
    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    defaultBrand?: string;

    @IsOptional()
    @IsString()
    defaultModel?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;

    @IsOptional()
    @IsInt()
    sortOrder?: number;
}
