'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';

export interface PedagogicalHour {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    sortOrder: number;
    isBreak: boolean;
    active: boolean;
}

export function usePedagogicalHours() {
    const api = useApiClient();
    return useQuery<PedagogicalHour[]>({
        queryKey: ['pedagogical-hours'],
        queryFn: () => api.get<PedagogicalHour[]>('/api/pedagogical-hours'),
        staleTime: 30 * 60 * 1000, // 30 minutes - pedagogical hours rarely change
        gcTime: 60 * 60 * 1000, // 1 hour in cache
    });
}

export function useCreatePedagogicalHour() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: Omit<PedagogicalHour, 'id' | 'active'>) =>
            api.post<PedagogicalHour>('/api/pedagogical-hours', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
            showSuccess('Hora pedagógica creada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear la hora pedagógica');
        },
    });
}

export function useUpdatePedagogicalHour() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: ({ id, ...data }: Partial<PedagogicalHour> & { id: string }) =>
            api.put<PedagogicalHour>(`/api/pedagogical-hours/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
            showSuccess('Hora pedagógica actualizada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar la hora pedagógica');
        },
    });
}

export function useDeletePedagogicalHour() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/api/pedagogical-hours/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
            showSuccess('Hora pedagógica eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar la hora pedagógica');
        },
    });
}
