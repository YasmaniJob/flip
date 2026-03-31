'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';
import { useConfigLoadout } from './use-config-loadout';

export interface Section {
    id: string;
    name: string;
    gradeId: string;
    studentCount?: number;
}

export function useSections(gradeId?: string, options: { enabled?: boolean } = {}) {
    const config = useConfigLoadout({ enabled: options.enabled });
    
    // Transform data from config-loadout
    const sections = config.data?.sections || [];
    const filtered = gradeId 
        ? sections.filter(s => s.gradeId === gradeId)
        : sections;

    return {
        ...config,
        data: filtered,
    };
}

export function useCreateSection() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: Omit<Section, 'id'>) => api.post<Section>('/sections', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Sección creada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear la sección');
        },
    });
}

export function useBulkCreateSections() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: { sections: Omit<Section, 'id'>[] }) => api.post<Section[]>('/sections/bulk', data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess(`${data.length} secciones creadas correctamente`);
        },
        onError: (error) => {
            handleApiError(error, 'No se pudieron crear las secciones');
        },
    });
}

export function useUpdateSection() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Section> & { id: string }) =>
            api.put<Section>(`/sections/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Sección actualizada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar la sección');
        },
    });
}

export function useDeleteSection() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ success: boolean; message: string }>(`/sections/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Sección eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar la sección');
        },
    });
}
