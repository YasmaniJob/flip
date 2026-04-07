export interface PedagogicalHour {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

export interface ReservationSlot {
    id: string;
    reservationId: string;
    date: string;
    attended: boolean;
    attendedAt: string | null;
    notAttended: boolean;
    notAttendedAt: string | null;
    pedagogicalHour: PedagogicalHour;
    staff?: {
        id: string;
        name: string;
        role?: string;
    };
    grade?: {
        id: string;
        name: string;
    } | null;
    section?: {
        id: string;
        name: string;
    } | null;
    curricularArea?: {
        id: string;
        name: string;
    } | null;
    purpose?: string;
    type?: 'class' | 'workshop';
    title?: string | null;
    reservationMainId?: string;
    classroomId?: string;
    attendance?: any[];
}

export interface ReservationAttendance {
    id: string;
    reservationId: string;
    staffId: string;
    status: 'presente' | 'ausente' | 'tardanza';
    notes: string | null;
    staffName?: string;
    staffRole?: string;
}

export interface ReservationTask {
    id: string;
    reservationId: string;
    description: string;
    assignedStaffId: string | null;
    status: 'pending' | 'completed';
    dueDate: string | null;
    assignedStaffName?: string;
}

export interface CreateReservationData {
    staffId: string;
    classroomId?: string;
    slots: { pedagogicalHourId: string; date: string }[];
    gradeId?: string;
    sectionId?: string;
    curricularAreaId?: string;
    purpose?: string;
    type?: 'class' | 'workshop';
    title?: string;
}

const BASE_URL = '/api/classroom-reservations';

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        // Intentar parsear el error como JSON, si falla usar null
        const error = await res.json().catch(() => null);
        
        // Construir mensaje de error con fallbacks
        const errorMessage = error?.message || error?.error || `Error ${res.status}: ${res.statusText || 'Error desconocido'}`;
        
        // Log más detallado para debugging
        console.error('[Reservations API] Error:', errorMessage, {
            url: res.url,
            status: res.status,
            statusText: res.statusText,
            errorBody: error,
        });
        
        throw new Error(errorMessage);
    }
    
    if (res.status === 204) return {} as T;
    
    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
}

export const ReservationsApi = {
    getByDateRange: async (startDate: string, endDate: string, classroomId?: string, shift?: string): Promise<ReservationSlot[]> => {
        let url = `${BASE_URL}?startDate=${startDate}&endDate=${endDate}`;
        if (classroomId) url += `&classroomId=${classroomId}`;
        if (shift) url += `&shift=${shift}`;
        
        const res = await fetch(url);
        const response = await handleResponse<{ data: any[]; pagination: any }>(res);
        
        // Flatten reservations into slots array
        const slots: ReservationSlot[] = [];
        response.data.forEach((reservation: any) => {
            if (reservation.slots && Array.isArray(reservation.slots)) {
                reservation.slots.forEach((slot: any) => {
                    slots.push({
                        id: slot.id,
                        reservationId: reservation.id,
                        date: slot.date,
                        attended: slot.attended,
                        attendedAt: slot.attendedAt,
                        notAttended: slot.notAttended,
                        notAttendedAt: slot.notAttendedAt,
                        pedagogicalHour: slot.pedagogicalHour,
                        staff: reservation.staff ? {
                            id: reservation.staff.id,
                            name: reservation.staff.user?.name || reservation.staff.name || 'Sin nombre',
                            role: reservation.staff.role,
                        } : undefined,
                        grade: reservation.grade,
                        section: reservation.section,
                        curricularArea: reservation.curricularArea,
                        purpose: reservation.purpose,
                        type: reservation.type,
                        title: reservation.title,
                        reservationMainId: reservation.id,
                        classroomId: reservation.classroomId || slot.classroomId,
                    });
                });
            }
        });
        
        return slots;
    },

    getMyToday: async (): Promise<ReservationSlot[]> => {
        const res = await fetch(`${BASE_URL}/my-today`);
        return handleResponse<ReservationSlot[]>(res);
    },

    create: async (data: CreateReservationData): Promise<any> => {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<any>(res);
    },

    cancel: async (id: string): Promise<any> => {
        const res = await fetch(`${BASE_URL}/${id}/cancel`, { method: 'PUT' });
        return handleResponse<any>(res);
    },

    cancelSlot: async (slotId: string): Promise<any> => {
        const res = await fetch(`${BASE_URL}/slots/${slotId}`, { method: 'DELETE' });
        return handleResponse<any>(res);
    },

    markAttendance: async (slotId: string, options: { attended?: boolean; notAttended?: boolean }): Promise<any> => {
        const res = await fetch(`${BASE_URL}/slots/${slotId}/attendance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options),
        });
        return handleResponse<any>(res);
    },

    reschedule: async (slotId: string, newDate: string, newPedagogicalHourId: string): Promise<any> => {
        const res = await fetch(`${BASE_URL}/slots/${slotId}/reschedule`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newDate, newPedagogicalHourId }),
        });
        return handleResponse<any>(res);
    },

    rescheduleBlock: async (reservationId: string, slots: { date: string, pedagogicalHourId: string }[]): Promise<any> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/reschedule-block`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slots }),
        });
        return handleResponse<any>(res);
    },

    // ============================================
    // RESERVATION ATTENDANCE (per-person for workshops)
    // ============================================

    getAttendance: async (reservationId: string): Promise<ReservationAttendance[]> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/attendance`);
        return handleResponse<ReservationAttendance[]>(res);
    },

    addAttendee: async (reservationId: string, data: { staffId?: string; staffIds?: string[] }): Promise<{ count: number }> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<{ count: number }>(res);
    },

    bulkUpdateAttendance: async (reservationId: string, updates: { attendanceId: string; status: string }[]): Promise<void> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/attendance/bulk`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates }),
        });
        return handleResponse<void>(res);
    },

    removeAttendee: async (attendanceId: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/attendance/${attendanceId}`, { method: 'DELETE' });
        return handleResponse<void>(res);
    },

    checkIn: async (reservationId: string): Promise<any> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/attendance/check-in`, { method: 'POST' });
        return handleResponse<any>(res);
    },

    // ============================================
    // RESERVATION TASKS (agreements for workshops)
    // ============================================

    getTasks: async (reservationId: string): Promise<ReservationTask[]> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/tasks`);
        return handleResponse<ReservationTask[]>(res);
    },

    createTask: async (reservationId: string, task: Partial<ReservationTask>): Promise<ReservationTask> => {
        const res = await fetch(`${BASE_URL}/${reservationId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        return handleResponse<ReservationTask>(res);
    },

    updateTask: async (taskId: string, data: Partial<ReservationTask>): Promise<ReservationTask> => {
        const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse<ReservationTask>(res);
    },

    deleteTask: async (taskId: string): Promise<void> => {
        const res = await fetch(`${BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
        return handleResponse<void>(res);
    },
};
