'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';

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
