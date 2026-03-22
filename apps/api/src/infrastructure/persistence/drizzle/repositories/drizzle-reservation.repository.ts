import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { IReservationRepository, FindReservationsFilters, ReservationAttendanceRecord, ReservationTaskRecord } from '../../../../core/ports/outbound/reservation.repository';
import { ClassroomReservation, ReservationSlot, ReservationStatus } from '../../../../core/domain/entities/classroom-reservation.entity';
import { InstitutionId, generateId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleReservationRepository implements IReservationRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(
        row: typeof schema.classroomReservations.$inferSelect,
        slots: (typeof schema.reservationSlots.$inferSelect)[] = []
    ): ClassroomReservation {
        return new ClassroomReservation(
            row.id,
            InstitutionId.create(row.institutionId),
            row.staffId,
            row.gradeId,
            row.sectionId,
            row.curricularAreaId,
            row.purpose,
            (row.status || 'active') as ReservationStatus,
            row.createdAt || new Date(),
            row.cancelledAt,
            slots.map(s => ({
                id: s.id,
                pedagogicalHourId: s.pedagogicalHourId,
                date: s.date,
                attended: s.attended || false,
                attendedAt: s.attendedAt,
            })),
            (row.type as 'class' | 'workshop') || 'class',
            row.title,
            row.classroomId
        );
    }

    private mapToSlotResponse(row: any) {
        return {
            id: row.slot.id,
            reservationId: row.slot.reservationId,
            date: row.slot.date,
            attended: row.slot.attended,
            attendedAt: row.slot.attendedAt,
            pedagogicalHour: {
                id: row.pedagogicalHour.id,
                name: row.pedagogicalHour.name,
                startTime: row.pedagogicalHour.startTime,
                endTime: row.pedagogicalHour.endTime,
            },
            staff: row.staff ? {
                id: row.staff.id,
                name: row.staff.name,
            } : undefined,
            grade: row.grade ? { id: row.grade.id, name: row.grade.name } : null,
            section: row.section ? { id: row.section.id, name: row.section.name } : null,
            curricularArea: row.curricularArea ? { id: row.curricularArea.id, name: row.curricularArea.name } : null,
            purpose: row.reservation.purpose,
            type: row.reservation.type,
            title: row.reservation.title,
            reservationMainId: row.reservation.id,
            classroomId: row.slot.classroomId,
        };
    }

    async save(reservation: ClassroomReservation): Promise<ClassroomReservation> {
        if (!reservation.classroomId) {
            throw new Error('No classroom ID provided for reservation');
        }

        const classroomId = reservation.classroomId as string;

        await this.db.transaction(async (tx) => {
            try {
                await tx.insert(schema.classroomReservations).values({
                    id: reservation.id,
                    institutionId: reservation.institutionId.value,
                    staffId: reservation.staffId,
                    gradeId: reservation.gradeId,
                    sectionId: reservation.sectionId,
                    curricularAreaId: reservation.curricularAreaId,
                    type: reservation.type,
                    title: reservation.title,
                    purpose: reservation.purpose,
                    status: reservation.status,
                    classroomId: classroomId,
                });

                if (reservation.slots.length > 0) {
                    await tx.insert(schema.reservationSlots).values(
                        reservation.slots.map(s => ({
                            id: s.id,
                            reservationId: reservation.id,
                            institutionId: reservation.institutionId.value,
                            pedagogicalHourId: s.pedagogicalHourId,
                            date: s.date,
                            attended: s.attended,
                            attendedAt: s.attendedAt,
                            classroomId: classroomId,
                        }))
                    );
                }
            } catch (error: any) {
                console.error('Database Error in ReservationRepository.save:', error);
                throw error;
            }
        });

        return reservation;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<ClassroomReservation | null> {
        const result = await this.db.query.classroomReservations.findFirst({
            where: and(
                eq(schema.classroomReservations.id, id),
                eq(schema.classroomReservations.institutionId, institutionId.value)
            ),
            with: {
                slots: true
            }
        });

        if (!result) return null;
        return this.toDomain(result, result.slots);
    }

    async findAll(institutionId: InstitutionId, filters?: FindReservationsFilters): Promise<ClassroomReservation[]> {
        const conditions = [eq(schema.classroomReservations.institutionId, institutionId.value)];

        if (filters?.staffId) {
            conditions.push(eq(schema.classroomReservations.staffId, filters.staffId));
        }
        if (filters?.status) {
            conditions.push(eq(schema.classroomReservations.status, filters.status));
        }

        const results = await this.db.query.classroomReservations.findMany({
            where: and(...conditions),
            with: {
                slots: true,
                staff: true,
                grade: true,
                section: true,
            },
            orderBy: (res, { desc }) => [desc(res.createdAt)],
        });

        return results.map(r => this.toDomain(r, r.slots));
    }

    async findSlotsByDateRange(
        institutionId: InstitutionId,
        startDate: Date,
        endDate: Date,
        classroomId?: string,
        shift?: string
    ): Promise<any[]> {
        const conditions = [
            eq(schema.reservationSlots.institutionId, institutionId.value),
            gte(schema.reservationSlots.date, startDate),
            lte(schema.reservationSlots.date, endDate),
            eq(schema.classroomReservations.status, 'active')
        ];

        if (classroomId) {
            conditions.push(eq(schema.reservationSlots.classroomId, classroomId));
        }

        if (shift === 'mañana') {
            conditions.push(lte(schema.pedagogicalHours.startTime, '13:00'));
        } else if (shift === 'tarde') {
            conditions.push(gte(schema.pedagogicalHours.startTime, '13:00'));
        }

        const results = await this.db
            .select({
                slot: schema.reservationSlots,
                reservation: schema.classroomReservations,
                staff: schema.staff,
                pedagogicalHour: schema.pedagogicalHours,
                grade: schema.grades,
                section: schema.sections,
                curricularArea: schema.curricularAreas,
            })
            .from(schema.reservationSlots)
            .innerJoin(schema.classroomReservations, eq(schema.reservationSlots.reservationId, schema.classroomReservations.id))
            .innerJoin(schema.staff, eq(schema.classroomReservations.staffId, schema.staff.id))
            .innerJoin(schema.pedagogicalHours, eq(schema.reservationSlots.pedagogicalHourId, schema.pedagogicalHours.id))
            .leftJoin(schema.grades, eq(schema.classroomReservations.gradeId, schema.grades.id))
            .leftJoin(schema.sections, eq(schema.classroomReservations.sectionId, schema.sections.id))
            .leftJoin(schema.curricularAreas, eq(schema.classroomReservations.curricularAreaId, schema.curricularAreas.id))
            .where(and(...conditions));

        return results.map(r => this.mapToSlotResponse(r));
    }

    async findTodaySlotsByStaff(institutionId: InstitutionId, staffId: string): Promise<any[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const results = await this.db
            .select({
                slot: schema.reservationSlots,
                reservation: schema.classroomReservations,
                pedagogicalHour: schema.pedagogicalHours,
            })
            .from(schema.reservationSlots)
            .innerJoin(schema.classroomReservations, eq(schema.reservationSlots.reservationId, schema.classroomReservations.id))
            .innerJoin(schema.pedagogicalHours, eq(schema.reservationSlots.pedagogicalHourId, schema.pedagogicalHours.id))
            .where(and(
                eq(schema.reservationSlots.institutionId, institutionId.value),
                eq(schema.classroomReservations.staffId, staffId),
                eq(schema.classroomReservations.status, 'active'),
                gte(schema.reservationSlots.date, today),
                lte(schema.reservationSlots.date, tomorrow)
            ))
            .orderBy(schema.pedagogicalHours.sortOrder);

        return results.map(r => this.mapToSlotResponse(r));
    }

    async update(reservation: ClassroomReservation): Promise<ClassroomReservation> {
        await this.db.transaction(async (tx) => {
            await tx.update(schema.classroomReservations)
                .set({
                    status: reservation.status,
                    cancelledAt: reservation.cancelledAt,
                })
                .where(eq(schema.classroomReservations.id, reservation.id));

            if (reservation.status === 'cancelled') {
                await tx.delete(schema.reservationSlots)
                    .where(eq(schema.reservationSlots.reservationId, reservation.id));
            }
        });
        return reservation;
    }

    async updateSlotAttendance(slotId: string, attended: boolean): Promise<void> {
        await this.db.update(schema.reservationSlots)
            .set({
                attended,
                attendedAt: attended ? new Date() : null,
            })
            .where(eq(schema.reservationSlots.id, slotId));
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        await this.db.transaction(async (tx) => {
            const reservation = await tx.query.classroomReservations.findFirst({
                where: and(
                    eq(schema.classroomReservations.id, id),
                    eq(schema.classroomReservations.institutionId, institutionId.value)
                ),
            });

            if (reservation) {
                await tx.delete(schema.reservationSlots)
                    .where(eq(schema.reservationSlots.reservationId, id));
                await tx.delete(schema.classroomReservations)
                    .where(eq(schema.classroomReservations.id, id));
            }
        });
        return true;
    }

    // ============================================
    // RESERVATION ATTENDANCE (per-person for workshops)
    // ============================================

    async findAttendanceByReservation(reservationId: string): Promise<ReservationAttendanceRecord[]> {
        const results = await this.db.query.reservationAttendance.findMany({
            where: eq(schema.reservationAttendance.reservationId, reservationId),
            with: { staff: true },
        });

        return results.map(r => ({
            id: r.id,
            reservationId: r.reservationId,
            staffId: r.staffId,
            status: (r.status || 'presente') as ReservationAttendanceRecord['status'],
            notes: r.notes,
            staffName: (r as any).staff?.name,
            staffRole: (r as any).staff?.role,
        }));
    }

    async saveAttendance(reservationId: string, staffId: string): Promise<ReservationAttendanceRecord> {
        const id = generateId();
        await this.db.insert(schema.reservationAttendance).values({
            id,
            reservationId,
            staffId,
            status: 'presente',
        });

        const staff = await this.db.query.staff.findFirst({
            where: eq(schema.staff.id, staffId),
        });

        return {
            id,
            reservationId,
            staffId,
            status: 'presente',
            notes: null,
            staffName: staff?.name,
            staffRole: staff?.role || undefined,
        };
    }

    async updateAttendanceStatus(attendanceId: string, status: string): Promise<void> {
        await this.db.update(schema.reservationAttendance)
            .set({ status, updatedAt: new Date() })
            .where(eq(schema.reservationAttendance.id, attendanceId));
    }

    async bulkUpdateAttendanceStatus(updates: { attendanceId: string; status: string }[]): Promise<void> {
        await this.db.transaction(async (tx) => {
            for (const update of updates) {
                await tx.update(schema.reservationAttendance)
                    .set({ status: update.status, updatedAt: new Date() })
                    .where(eq(schema.reservationAttendance.id, update.attendanceId));
            }
        });
    }

    async removeAttendance(attendanceId: string): Promise<void> {
        await this.db.delete(schema.reservationAttendance)
            .where(eq(schema.reservationAttendance.id, attendanceId));
    }

    // ============================================
    // RESERVATION TASKS (agreements for workshops)
    // ============================================

    async findTasksByReservation(reservationId: string): Promise<ReservationTaskRecord[]> {
        const results = await this.db.query.reservationTasks.findMany({
            where: eq(schema.reservationTasks.reservationId, reservationId),
            with: { assignedStaff: true },
        });

        return results.map(r => ({
            id: r.id,
            reservationId: r.reservationId,
            description: r.description,
            assignedStaffId: r.assignedStaffId,
            status: (r.status || 'pending') as ReservationTaskRecord['status'],
            dueDate: r.dueDate,
            assignedStaffName: (r as any).assignedStaff?.name,
        }));
    }

    async saveTask(reservationId: string, task: { description: string; assignedStaffId?: string; dueDate?: Date }): Promise<ReservationTaskRecord> {
        const id = generateId();
        await this.db.insert(schema.reservationTasks).values({
            id,
            reservationId,
            description: task.description,
            assignedStaffId: task.assignedStaffId || null,
            dueDate: task.dueDate || null,
            status: 'pending',
        });

        return {
            id,
            reservationId,
            description: task.description,
            assignedStaffId: task.assignedStaffId || null,
            status: 'pending',
            dueDate: task.dueDate || null,
        };
    }

    async updateTask(taskId: string, data: Partial<{ description: string; status: string; assignedStaffId: string; dueDate: Date }>): Promise<ReservationTaskRecord> {
        await this.db.update(schema.reservationTasks)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.reservationTasks.id, taskId));

        const updated = await this.db.query.reservationTasks.findFirst({
            where: eq(schema.reservationTasks.id, taskId),
            with: { assignedStaff: true },
        });

        return {
            id: updated!.id,
            reservationId: updated!.reservationId,
            description: updated!.description,
            assignedStaffId: updated!.assignedStaffId,
            status: (updated!.status || 'pending') as ReservationTaskRecord['status'],
            dueDate: updated!.dueDate,
            assignedStaffName: (updated as any)?.assignedStaff?.name,
        };
    }

    async deleteTask(taskId: string): Promise<void> {
        await this.db.delete(schema.reservationTasks)
            .where(eq(schema.reservationTasks.id, taskId));
    }
}
