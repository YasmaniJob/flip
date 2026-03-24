import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';

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
        staleTime: 30 * 60 * 1000, // 30 minutes - classrooms rarely change
        gcTime: 60 * 60 * 1000, // 1 hour in cache
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
            showSuccess('Aula creada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear el aula');
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
            showSuccess('Aula actualizada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar el aula');
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
            showSuccess('Aula eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar el aula');
        },
    });
}
