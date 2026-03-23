import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReservationsApi, ReservationSlot, CreateReservationData, ReservationAttendance, ReservationTask } from '../api/reservations.api';
import { toast } from 'sonner';

export type { ReservationSlot, CreateReservationData, ReservationAttendance, ReservationTask };

export const reservationKeys = {
    all: ['reservations'] as const,
    byDateRange: (start: string, end: string, classroomId?: string, shift?: string) =>
        [...reservationKeys.all, 'range', start, end, classroomId, shift] as const,
    myToday: () => [...reservationKeys.all, 'my-today'] as const,
    attendance: (reservationId: string) => [...reservationKeys.all, 'attendance', reservationId] as const,
    tasks: (reservationId: string) => [...reservationKeys.all, 'tasks', reservationId] as const,
};

export function useReservationsByDateRange(startDate: string, endDate: string, classroomId?: string, shift?: string) {
    return useQuery({
        queryKey: reservationKeys.byDateRange(startDate, endDate, classroomId, shift),
        queryFn: () => ReservationsApi.getByDateRange(startDate, endDate, classroomId, shift),
        staleTime: 5 * 60 * 1000, // 5 minutos - las reservas no cambian tan rápido
        enabled: !!startDate && !!endDate && !!classroomId,
        placeholderData: (previousData) => previousData,
    });
}

export function useMyTodayReservations() {
    return useQuery({
        queryKey: reservationKeys.myToday(),
        queryFn: ReservationsApi.getMyToday,
        staleTime: 2 * 60 * 1000, // 2 minutos (aumentado de 30s - agenda del día no cambia tan rápido)
    });
}

export function useCreateReservation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ReservationsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Reserva creada correctamente');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || error.message || 'Error al crear la reserva';
            toast.error(message);
        },
    });
}

export function useCancelReservation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ReservationsApi.cancel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Reserva cancelada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al cancelar la reserva');
        },
    });
}

export function useCancelSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (slotId: string) => ReservationsApi.cancelSlot(slotId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Hora cancelada correctamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al cancelar la hora');
        },
    });
}

export function useMarkAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ slotId, attended }: { slotId: string; attended?: boolean }) =>
            ReservationsApi.markAttendance(slotId, attended),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Asistencia actualizada');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al actualizar asistencia');
        },
    });
}

export function useRescheduleSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ slotId, newDate, newPedagogicalHourId }: {
            slotId: string;
            newDate: string;
            newPedagogicalHourId: string;
        }) => ReservationsApi.reschedule(slotId, newDate, newPedagogicalHourId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Reserva reprogramada correctamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al reprogramar reserva');
        },
    });
}

export function useRescheduleBlock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, slots }: {
            reservationId: string;
            slots: { date: string; pedagogicalHourId: string }[];
        }) => ReservationsApi.rescheduleBlock(reservationId, slots),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Reprogramación de bloque exitosa');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al reprogramar el bloque');
        },
    });
}

// ============================================
// RESERVATION ATTENDANCE HOOKS (per-person for workshops)
// ============================================

export function useReservationAttendance(reservationId: string) {
    return useQuery({
        queryKey: reservationKeys.attendance(reservationId),
        queryFn: () => ReservationsApi.getAttendance(reservationId),
        enabled: !!reservationId,
    });
}

export function useAddReservationAttendee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, staffId }: { reservationId: string; staffId: string }) =>
            ReservationsApi.addAttendee(reservationId, staffId),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.attendance(vars.reservationId) });
            toast.success('Participante agregado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al agregar participante');
        },
    });
}

export function useBulkUpdateReservationAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, updates }: { reservationId: string; updates: { attendanceId: string; status: string }[] }) =>
            ReservationsApi.bulkUpdateAttendance(reservationId, updates),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.attendance(vars.reservationId) });
        },
    });
}

export function useRemoveReservationAttendee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attendanceId: string) => ReservationsApi.removeAttendee(attendanceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Participante removido');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al remover participante');
        },
    });
}

// ============================================
// RESERVATION TASKS HOOKS (agreements for workshops)
// ============================================

export function useReservationTasks(reservationId: string) {
    return useQuery({
        queryKey: reservationKeys.tasks(reservationId),
        queryFn: () => ReservationsApi.getTasks(reservationId),
        enabled: !!reservationId,
    });
}

export function useCreateReservationTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, task }: { reservationId: string; task: Partial<ReservationTask> }) =>
            ReservationsApi.createTask(reservationId, task),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.tasks(vars.reservationId) });
            toast.success('Acuerdo creado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al crear acuerdo');
        },
    });
}

export function useUpdateReservationTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, data }: { taskId: string; data: Partial<ReservationTask> }) =>
            ReservationsApi.updateTask(taskId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
        },
    });
}

export function useDeleteReservationTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => ReservationsApi.deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            toast.success('Acuerdo eliminado');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar acuerdo');
        },
    });
}
