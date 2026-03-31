import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import { handleApiError, showSuccess } from '@/lib/error-handler';
import { useConfigLoadout } from '@/features/settings/hooks/use-config-loadout';

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
    const config = useConfigLoadout();
    return {
        ...config,
        data: config.data?.classrooms || [],
    };
}

export function useCreateClassroom() {
    const apiClient = useApiClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; code?: string; isPrimary?: boolean; sortOrder?: number }) =>
            apiClient.post<Classroom>('/classrooms', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: classroomKeys.list() });
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
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
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
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
            queryClient.invalidateQueries({ queryKey: ['institution', 'config-loadout'] });
            showSuccess('Aula eliminada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar el aula');
        },
    });
}
