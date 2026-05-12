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
        staleTime: 60 * 1000, // 1 minute fresh time to avoid waterfall spam
        enabled: !!startDate && !!endDate && !!classroomId,
        placeholderData: (previousData) => previousData,
        retry: 2,
    });
}

export function useMyTodayReservations() {
    return useQuery({
        queryKey: reservationKeys.myToday(),
        queryFn: ReservationsApi.getMyToday,
        staleTime: 5 * 60 * 1000, // 5 minutes fresh time
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
        mutationFn: ({ slotId, attended, notAttended }: { slotId: string; attended?: boolean; notAttended?: boolean }) =>
            ReservationsApi.markAttendance(slotId, { attended, notAttended }),
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
        refetchInterval: 5000, // Poll every 5 seconds for real-time QR updates
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
            queryClient.invalidateQueries({ queryKey: ['staff'] });
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
        onMutate: async ({ reservationId, updates }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: reservationKeys.attendance(reservationId) });

            // Snapshot the previous value
            const previousAttendance = queryClient.getQueryData<ReservationAttendance[]>(reservationKeys.attendance(reservationId));

            // Optimistically update to the new value
            if (previousAttendance) {
                queryClient.setQueryData<ReservationAttendance[]>(
                    reservationKeys.attendance(reservationId),
                    previousAttendance.map(item => {
                        const update = updates.find(u => u.attendanceId === item.id);
                        return update ? { ...item, status: update.status as any } : item;
                    })
                );
            }

            return { previousAttendance };
        },
        onError: (err, vars, context) => {
            if (context?.previousAttendance) {
                queryClient.setQueryData(reservationKeys.attendance(vars.reservationId), context.previousAttendance);
            }
            handleApiError(err, 'No se pudo actualizar la asistencia');
        },
        onSettled: (data, error, vars) => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.attendance(vars.reservationId) });
        },
    });
}

export function useRemoveReservationAttendee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attendanceId: string) => ReservationsApi.removeAttendee(attendanceId),
        onMutate: async (attendanceId) => {
            // We don't have reservationId here, so we have to find which query contains this ID
            // or just invalidate broadly. For better UX, we try to find the query.
            const queries = queryClient.getQueryCache().findAll({ queryKey: reservationKeys.all });
            const queriesToRestore: any[] = [];

            for (const query of queries) {
                if (query.queryKey[1] === 'attendance') {
                    const data = query.state.data as ReservationAttendance[];
                    if (data?.find(a => a.id === attendanceId)) {
                        const previousData = data;
                        queryClient.setQueryData(query.queryKey, data.filter(a => a.id !== attendanceId));
                        queriesToRestore.push({ key: query.queryKey, previousData });
                    }
                }
            }

            return { queriesToRestore };
        },
        onError: (err, vars, context) => {
            context?.queriesToRestore.forEach(q => {
                queryClient.setQueryData(q.key, q.previousData);
            });
            handleApiError(err, 'No se pudo remover el participante');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Participante removido');
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
        refetchInterval: 10000, // Poll every 10 seconds for tasks
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
        onMutate: async ({ taskId, data }) => {
            const queries = queryClient.getQueryCache().findAll({ queryKey: reservationKeys.all });
            const snapshots: any[] = [];

            for (const query of queries) {
                if (query.queryKey[1] === 'tasks') {
                    const tasks = query.state.data as ReservationTask[];
                    if (tasks?.find(t => t.id === taskId)) {
                        snapshots.push({ key: query.queryKey, previousData: tasks });
                        queryClient.setQueryData(query.queryKey, tasks.map(t => 
                            t.id === taskId ? { ...t, ...data } : t
                        ));
                    }
                }
            }
            return { snapshots };
        },
        onError: (err, vars, context) => {
            context?.snapshots.forEach(s => {
                queryClient.setQueryData(s.key, s.previousData);
            });
            handleApiError(err, 'No se pudo actualizar el acuerdo');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
        },
    });
}

export function useDeleteReservationTask() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (taskId: string) => ReservationsApi.deleteTask(taskId),
        onMutate: async (taskId) => {
            const queries = queryClient.getQueryCache().findAll({ queryKey: reservationKeys.all });
            const snapshots: any[] = [];

            for (const query of queries) {
                if (query.queryKey[1] === 'tasks') {
                    const tasks = query.state.data as ReservationTask[];
                    if (tasks?.find(t => t.id === taskId)) {
                        snapshots.push({ key: query.queryKey, previousData: tasks });
                        queryClient.setQueryData(query.queryKey, tasks.filter(t => t.id !== taskId));
                    }
                }
            }
            return { snapshots };
        },
        onError: (err, vars, context) => {
            context?.snapshots.forEach(s => {
                queryClient.setQueryData(s.key, s.previousData);
            });
            handleApiError(err, 'No se pudo eliminar el acuerdo');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reservationKeys.all });
            showSuccess('Acuerdo eliminado');
        },
    });
}

