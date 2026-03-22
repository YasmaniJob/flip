import { IsString, IsOptional, IsUUID, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateResourceDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    templateId?: string;

    @IsString()
    @IsOptional()
    brand?: string;

    @IsString()
    @IsOptional()
    model?: string;

    @IsString()
    @IsOptional()
    serialNumber?: string;

    @IsString()
    @IsOptional()
    condition?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsNumber()
    @IsOptional()
    stock?: number;
}
