import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingsApi } from "../api/meetings.api";
import { handleApiError, showSuccess } from "@/lib/error-handler";

const STALE_TIME = 1000 * 60 * 5; // 5 minutes cache

export function useMeetings() {
    return useQuery({
        queryKey: ['meetings'],
        queryFn: meetingsApi.findAll,
        staleTime: STALE_TIME,
        retry: 1,
    });
}

export function useMeeting(id: string) {
    return useQuery({
        queryKey: ['meetings', id],
        queryFn: () => meetingsApi.findById(id),
        enabled: !!id,
        staleTime: STALE_TIME,
    });
}

export function useCreateMeeting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: meetingsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            showSuccess("Reunión creada exitosamente");
        },
        onError: (error) => {
            handleApiError(error, "No se pudo crear la reunión");
        }
    });
}

export function useRemoveMeeting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: meetingsApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            showSuccess("Reunión eliminada");
        },
        onError: (error) => {
            handleApiError(error, "No se pudo eliminar la reunión");
        }
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ meetingId, task }: { meetingId: string, task: any }) => meetingsApi.createTask(meetingId, task),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId] });
            showSuccess("Acuerdo registrado exitosamente");
        },
        onError: (error) => {
            handleApiError(error, "No se pudo crear el acuerdo");
        }
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, task }: { taskId: string, task: any }) => meetingsApi.updateTask(taskId, task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            showSuccess("Acuerdo actualizado");
        },
        onError: (error) => {
            handleApiError(error, "No se pudo actualizar el acuerdo");
        }
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: meetingsApi.deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            showSuccess("Acuerdo eliminado");
        },
        onError: (error) => {
            handleApiError(error, "No se pudo eliminar el acuerdo");
        }
    });
}
