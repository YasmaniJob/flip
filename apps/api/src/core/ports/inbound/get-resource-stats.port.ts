export interface ResourceStats {
    total: number;
    disponible: number;
    prestado: number;
    mantenimiento: number;
    baja: number;
}

export interface GetResourceStatsPort {
    execute(institutionId: string): Promise<ResourceStats>;
}
