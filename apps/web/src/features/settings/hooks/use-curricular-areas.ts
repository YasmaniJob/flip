'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';
import { useConfigLoadout } from './use-config-loadout';

export interface CurricularArea {
    id: string;
    name: string;
    levels?: ('primaria' | 'secundaria')[];
    isStandard: boolean;
    active: boolean;
}

export function useCurricularAreas(options?: { level?: 'primaria' | 'secundaria'; activeOnly?: boolean }) {
    const config = useConfigLoadout();
    const { level, activeOnly } = options ?? {};

    // Transform data from config-loadout
    let areas = config.data?.curricularAreas || [];
    
    if (level) {
        areas = areas.filter(a => a.levels?.includes(level));
    }
    
    if (activeOnly) {
        areas = areas.filter(a => a.active);
    }

    return {
        ...config,
        data: areas,
    };
}

export function useCreateCurricularArea() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: { name: string; levels?: ('primaria' | 'secundaria')[] }) =>
            api.post<CurricularArea>('/curricular-areas', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curricular-areas'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Área curricular creada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear el área curricular');
        },
    });
}

export function useUpdateCurricularArea() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<CurricularArea> & { id: string }) =>
            api.put<CurricularArea>(`/curricular-areas/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curricular-areas'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Área curricular actualizada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar el área curricular');
        },
    });
}

export function useDeleteCurricularArea() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ success: boolean; message: string }>(`/curricular-areas/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curricular-areas'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Área curricular eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar el área curricular');
        },
    });
}

export function useSeedStandardAreas() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (selectedAreas?: string[]) =>
            api.post<{ seeded: number }>('/curricular-areas/seed-standard', { selectedAreas }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['curricular-areas'] });
            showSuccess(`${data.seeded} áreas curriculares agregadas correctamente`);
        },
        onError: (error) => {
            handleApiError(error, 'No se pudieron agregar las áreas curriculares');
        },
    });
}
