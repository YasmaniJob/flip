import { ClassroomReservation, ReservationSlot } from '../../domain/entities/classroom-reservation.entity';
import { InstitutionId } from '@flip/shared';

export interface FindReservationsFilters {
    startDate?: Date;
    endDate?: Date;
    staffId?: string;
    status?: 'active' | 'cancelled';
}

export interface ReservationAttendanceRecord {
    id: string;
    reservationId: string;
    staffId: string;
    status: 'presente' | 'ausente' | 'tardanza';
    notes: string | null;
    staffName?: string;
    staffRole?: string;
}

export interface ReservationTaskRecord {
    id: string;
    reservationId: string;
    description: string;
    assignedStaffId: string | null;
    status: 'pending' | 'completed';
    dueDate: Date | null;
    assignedStaffName?: string;
}

export interface IReservationRepository {
    save(reservation: ClassroomReservation): Promise<ClassroomReservation>;
    findById(id: string, institutionId: InstitutionId): Promise<ClassroomReservation | null>;
    findAll(institutionId: InstitutionId, filters?: FindReservationsFilters): Promise<ClassroomReservation[]>;
    findSlotsByDateRange(institutionId: InstitutionId, startDate: Date, endDate: Date, classroomId?: string, shift?: string): Promise<any[]>;
    findTodaySlotsByStaff(institutionId: InstitutionId, staffId: string): Promise<any[]>;
    update(reservation: ClassroomReservation): Promise<ClassroomReservation>;
    updateSlotAttendance(slotId: string, attended: boolean): Promise<void>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;

    // Reservation Attendance (per-person for workshops)
    findAttendanceByReservation(reservationId: string): Promise<ReservationAttendanceRecord[]>;
    saveAttendance(reservationId: string, staffId: string): Promise<ReservationAttendanceRecord>;
    updateAttendanceStatus(attendanceId: string, status: string): Promise<void>;
    bulkUpdateAttendanceStatus(updates: { attendanceId: string; status: string }[]): Promise<void>;
    removeAttendance(attendanceId: string): Promise<void>;

    // Reservation Tasks (agreements for workshops)
    findTasksByReservation(reservationId: string): Promise<ReservationTaskRecord[]>;
    saveTask(reservationId: string, task: { description: string; assignedStaffId?: string; dueDate?: Date }): Promise<ReservationTaskRecord>;
    updateTask(taskId: string, data: Partial<{ description: string; status: string; assignedStaffId: string; dueDate: Date }>): Promise<ReservationTaskRecord>;
    deleteTask(taskId: string): Promise<void>;
}

