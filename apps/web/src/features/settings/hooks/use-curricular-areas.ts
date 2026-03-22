'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export interface CurricularArea {
    id: string;
    name: string;
    levels?: ('primaria' | 'secundaria')[];
    isStandard: boolean;
    active: boolean;
}

export function useCurricularAreas(options?: { level?: 'primaria' | 'secundaria'; activeOnly?: boolean }) {
    const { level, activeOnly } = options ?? {};
    const api = useApiClient();

    return useQuery<CurricularArea[]>({
        queryKey: ['curricular-areas', level, activeOnly],
        queryFn: () => {
            const params = new URLSearchParams();
            if (level) params.set('level', level);
            if (activeOnly) params.set('active', 'true');

            const url = `/curricular-areas${params.toString() ? `?${params}` : ''}`;
            return api.get<CurricularArea[]>(url);
        },
        staleTime: 5 * 60 * 1000,  // 5 min — curricular areas rarely change
        gcTime: 10 * 60 * 1000,    // 10 min in memory
    });
}

export function useCreateCurricularArea() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: { name: string; levels?: ('primaria' | 'secundaria')[] }) =>
            api.post<CurricularArea>('/curricular-areas', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curricular-areas'] });
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
        },
    });
}

export function useSeedStandardAreas() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (selectedAreas?: string[]) =>
            api.post<{ seeded: number }>('/curricular-areas/seed-standard', { selectedAreas }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curricular-areas'] });
        },
    });
}
