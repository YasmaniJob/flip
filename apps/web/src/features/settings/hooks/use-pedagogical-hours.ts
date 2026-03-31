'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';
import { useConfigLoadout } from './use-config-loadout';

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
    const config = useConfigLoadout();
    return {
        ...config,
        data: config.data?.pedagogicalHours || [],
    };
}

export function useCreatePedagogicalHour() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: Omit<PedagogicalHour, 'id' | 'active'>) =>
            api.post<PedagogicalHour>('/pedagogical-hours', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
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
            api.put<PedagogicalHour>(`/pedagogical-hours/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
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
        mutationFn: (id: string) => api.delete(`/pedagogical-hours/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Hora pedagógica eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar la hora pedagógica');
        },
    });
}
