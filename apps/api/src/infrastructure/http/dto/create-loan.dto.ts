import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateLoanDto {
    @IsOptional()
    @IsString()
    staffId?: string;

    @IsArray()
    @IsString({ each: true })
    resourceIds!: string[];

    @IsOptional()
    @IsString()
    purpose?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    gradeId?: string;

    @IsOptional()
    @IsString()
    sectionId?: string;

    @IsOptional()
    @IsString()
    curricularAreaId?: string;

    @IsOptional()
    @IsString()
    studentPickupNote?: string;
}
