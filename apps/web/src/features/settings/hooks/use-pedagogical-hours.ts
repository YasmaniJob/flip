'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    return useQuery<PedagogicalHour[]>({
        queryKey: ['pedagogical-hours'],
        queryFn: async () => {
            const res = await fetch('/api/pedagogical-hours');
            if (!res.ok) throw new Error('Error al cargar horarios');
            return res.json();
        },
        staleTime: 30 * 60 * 1000, // 30 minutes - pedagogical hours rarely change
        gcTime: 60 * 60 * 1000, // 1 hour in cache
    });
}

export function useCreatePedagogicalHour() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<PedagogicalHour, 'id' | 'active'>) => {
            const res = await fetch('/api/pedagogical-hours', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Error al crear hora pedagógica');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
        },
    });
}

export function useUpdatePedagogicalHour() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<PedagogicalHour> & { id: string }) => {
            const res = await fetch(`/api/pedagogical-hours/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Error al actualizar hora pedagógica');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
        },
    });
}

export function useDeletePedagogicalHour() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/pedagogical-hours/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Error al eliminar hora pedagógica');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedagogical-hours'] });
        },
    });
}
