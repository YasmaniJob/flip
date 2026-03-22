import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';

export interface Classroom {
    id: string;
    institutionId: string;
    name: string;
    code?: string | null;
    isPrimary: boolean;
    sortOrder: number;
    active: boolean;
    createdAt: string;
}

export const classroomKeys = {
    all: ['classrooms'] as const,
    list: () => [...classroomKeys.all, 'list'] as const,
};

export function useClassrooms() {
    const apiClient = useApiClient();

    return useQuery({
        queryKey: classroomKeys.list(),
        queryFn: () => apiClient.get<Classroom[]>('/classrooms'),
    });
}

export function useCreateClassroom() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; code?: string; isPrimary?: boolean; sortOrder?: number }) =>
            apiClient.post<Classroom>('/classrooms', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classroomKeys.list() });
        },
    });
}

export function useUpdateClassroom() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; name?: string; code?: string; isPrimary?: boolean; sortOrder?: number; active?: boolean }) =>
            apiClient.put<Classroom>(`/classrooms/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classroomKeys.list() });
        },
    });
}

export function useDeleteClassroom() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.delete(`/classrooms/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classroomKeys.list() });
        },
    });
}
