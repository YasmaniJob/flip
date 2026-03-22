export interface ExternalInstitution {
    codigoModular: string;
    nombre: string;
    nivel: string; // Primaria, Secundaria, etc.
    direccion?: string;
    departamento?: string;
    provincia?: string;
    distrito?: string;
    tipoGestion?: string; // Pública, Privada
}

export interface IExternalInstitutionService {
    findByCodigoModular(codigoModular: string): Promise<ExternalInstitution | null>;
}
