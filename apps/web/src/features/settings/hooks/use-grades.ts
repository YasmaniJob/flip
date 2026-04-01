'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';
import { useConfigLoadout } from './use-config-loadout';

export interface Grade {
    id: string;
    name: string;
    level: 'primaria' | 'secundaria';
    sortOrder: number;
}

export function useGrades(level?: 'primaria' | 'secundaria') {
    const config = useConfigLoadout();

    // Transform data from config-loadout
    const grades = config.data?.grades || [];
    const filtered = level 
        ? grades.filter(g => g.level === level)
        : grades;

    return {
        ...config,
        data: filtered,
    };
}

export function useCreateGrade() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: Omit<Grade, 'id'>) => api.post<Grade | Grade[]>('/grades', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Grado creado correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear el grado');
        },
    });
}

export function useBulkCreateGrades() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: Omit<Grade, 'id'>[]) => api.post<Grade[]>('/grades', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Grados configurados correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear el catálogo de grados');
        },
    });
}

export function useUpdateGrade() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<Grade> & { id: string }) =>
            api.put<Grade>(`/grades/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Grado actualizado correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar el grado');
        },
    });
}

export function useDeleteGrade() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<{ success: boolean; message: string }>(`/grades/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Grado eliminado correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar el grado');
        },
    });
}
