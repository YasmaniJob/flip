import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReservationsApi, ReservationSlot, CreateReservationData, ReservationAttendance, ReservationTask } from '../api/reservations.api';
import { handleApiError, showSuccess } from '@/lib/error-handler';

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
        staleTime: 0,
        enabled: !!startDate && !!endDate && !!classroomId,
        placeholderData: (previousData) => previousData,
        retry: 2,
    });
}

export function useMyTodayReservations() {
    return useQuery({
        queryKey: reservationKeys.myToday(),
        queryFn: ReservationsApi.getMyToday,
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

export function useCreateReservation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ReservationsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Reserva creada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear la reserva');
        },
    });
}

export function useCancelReservation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ReservationsApi.cancel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Reserva cancelada');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo cancelar la reserva');
        },
    });
}

export function useCancelSlot() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (slotId: string) => ReservationsApi.cancelSlot(slotId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Hora cancelada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo cancelar la hora');
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
            showSuccess('Asistencia actualizada');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar la asistencia');
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
            showSuccess('Reserva reprogramada correctamente');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo reprogramar la reserva');
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
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            await queryClient.refetchQueries({ queryKey: reservationKeys.all });
            showSuccess('Reprogramación exitosa');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo reprogramar el bloque');
        },
    });
}

// ============================================
// RESERVATION ATTENDANCE HOOKS (per-person for workshops)
// ============================================

export function useReservationAttendance(reservationId: string, options?: any) {
    return useQuery({
        queryKey: reservationKeys.attendance(reservationId),
        queryFn: () => ReservationsApi.getAttendance(reservationId),
        enabled: !!reservationId && (options?.enabled !== false),
        ...options,
    });
}

export function useAddReservationAttendee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, staffId, staffIds }: { reservationId: string; staffId?: string; staffIds?: string[] }) =>
            ReservationsApi.addAttendee(reservationId, { staffId, staffIds }),
        onSuccess: (data, vars) => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.attendance(vars.reservationId) });
            queryClient.invalidateQueries({ queryKey: ['staff'] }); // Invalidate staff to refresh exclusion filters
            const count = data.count || (vars.staffIds?.length || 1);
            showSuccess(count > 1 ? `${count} participantes agregados` : 'Participante agregado');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo agregar el participante');
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
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar la asistencia');
        },
    });
}

export function useRemoveReservationAttendee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attendanceId: string) => ReservationsApi.removeAttendee(attendanceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Participante removido');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo remover el participante');
        },
    });
}

export function useCheckInReservation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reservationId: string) => ReservationsApi.checkIn(reservationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('¡Asistencia registrada!');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo registrar la asistencia');
        },
    });
}

// ============================================
// RESERVATION TASKS HOOKS (agreements for workshops)
// ============================================

export function useReservationTasks(reservationId: string, options?: any) {
    return useQuery({
        queryKey: reservationKeys.tasks(reservationId),
        queryFn: () => ReservationsApi.getTasks(reservationId),
        enabled: !!reservationId && (options?.enabled !== false),
        ...options,
    });
}

export function useCreateReservationTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ reservationId, task }: { reservationId: string; task: Partial<ReservationTask> }) =>
            ReservationsApi.createTask(reservationId, task),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.tasks(vars.reservationId) });
            showSuccess('Acuerdo creado');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo crear el acuerdo');
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
        onError: (error) => {
            handleApiError(error, 'No se pudo actualizar el acuerdo');
        },
    });
}

export function useDeleteReservationTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => ReservationsApi.deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Acuerdo eliminado');
        },
        onError: (error) => {
            handleApiError(error, 'No se pudo eliminar el acuerdo');
        },
    });
}
