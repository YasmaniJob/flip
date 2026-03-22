import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { meetingsApi } from "../api/meetings.api";
import { toast } from "sonner";

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
            toast.success("Reunión creada exitosamente");
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al crear la reunión");
        }
    });
}

export function useRemoveMeeting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: meetingsApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast.success("Reunión eliminada");
        },
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ meetingId, task }: { meetingId: string, task: any }) => meetingsApi.createTask(meetingId, task),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId] });
            toast.success("Acuerdo registrado exitosamente");
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al crear el acuerdo");
        }
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, task }: { taskId: string, task: any }) => meetingsApi.updateTask(taskId, task),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast.success("Acuerdo actualizado");
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al actualizar el acuerdo");
        }
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: meetingsApi.deleteTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast.success("Acuerdo eliminado");
        },
        onError: (error: any) => {
            toast.error(error.message || "Error al eliminar el acuerdo");
        }
    });
}
