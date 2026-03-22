'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export interface Grade {
    id: string;
    name: string;
    level: 'primaria' | 'secundaria';
    sortOrder: number;
}

export function useGrades(level?: 'primaria' | 'secundaria') {
    const api = useApiClient();
    return useQuery<Grade[]>({
        queryKey: ['grades', level],
        queryFn: () => {
            const url = level ? `/grades?level=${level}` : '/grades';
            return api.get<Grade[]>(url);
        },
        staleTime: 5 * 60 * 1000,  // 5 min — grades rarely change
        gcTime: 10 * 60 * 1000,    // 10 min in memory
    });
}

export function useCreateGrade() {
    const queryClient = useQueryClient();
    const api = useApiClient();

    return useMutation({
        mutationFn: (data: Omit<Grade, 'id'>) => api.post<Grade>('/grades', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grades'] });
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
        },
    });
}
