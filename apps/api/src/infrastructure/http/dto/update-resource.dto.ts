import { PartialType } from '@nestjs/mapped-types';
import { CreateResourceDto } from './create-resource.dto';
import { IsOptional, IsNumber, IsObject, ValidateIf } from 'class-validator';

export class UpdateResourceDto extends PartialType(CreateResourceDto) {
    @IsNumber()
    @IsOptional()
    maintenanceProgress?: number;

    // Permite null (para limpiar al finalizar mantenimiento) o un objeto
    @ValidateIf((o) => o.maintenanceState !== null)
    @IsObject()
    @IsOptional()
    maintenanceState?: Record<string, any> | null;
}
