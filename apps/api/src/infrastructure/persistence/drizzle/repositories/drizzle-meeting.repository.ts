import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../../database/schema';
import { IMeetingRepository } from '../../../../core/ports/outbound/meeting.repository';
import { Meeting, MeetingTask, MeetingStatus, TaskStatus } from '../../../../core/domain/entities/meeting.entity';
import { InstitutionId } from '@flip/shared';
import { DRIZZLE } from '../../../../database/database.module';

@Injectable()
export class DrizzleMeetingRepository implements IMeetingRepository {
    constructor(
        @Inject(DRIZZLE)
        private readonly db: NodePgDatabase<typeof schema>,
    ) { }

    private toDomain(row: typeof schema.meetings.$inferSelect): Meeting {
        return new Meeting(
            row.id,
            InstitutionId.create(row.institutionId),
            row.title,
            row.date,
            row.startTime,
            row.endTime,
            row.type || 'asistencia_tecnica',
            (row.status || 'active') as MeetingStatus,
            (row.involvedActors as string[]) || [],
            (row.involvedAreas as string[]) || [],
            row.notes,
            row.createdAt || undefined,
            row.updatedAt || undefined,
        );
    }

    private taskToDomain(row: any): MeetingTask {
        return new MeetingTask(
            row.id,
            row.meetingId,
            row.description,
            row.assignedStaffId,
            (row.status || 'pending') as TaskStatus,
            row.dueDate,
            row.assignedStaff?.name
        );
    }

    async save(meeting: Meeting): Promise<Meeting> {
        await this.db.insert(schema.meetings).values({
            id: meeting.id,
            institutionId: meeting.institutionId.value,
            title: meeting.title,
            date: meeting.date,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            type: meeting.type,
            status: meeting.status,
            involvedActors: meeting.involvedActors,
            involvedAreas: meeting.involvedAreas,
            notes: meeting.notes,
        });
        return meeting;
    }

    async findById(id: string, institutionId: InstitutionId): Promise<Meeting | null> {
        const result = await this.db.query.meetings.findFirst({
            where: (meetings, { eq, and }) => and(
                eq(meetings.id, id),
                eq(meetings.institutionId, institutionId.value)
            ),
            with: {
                tasks: {
                    with: {
                        assignedStaff: true
                    }
                }
            }
        });

        if (!result) return null;

        const meeting = this.toDomain(result);
        if (result.tasks) {
            meeting.tasks = result.tasks.map(t => this.taskToDomain(t));
        }

        return meeting;
    }

    async findAll(institutionId: InstitutionId): Promise<Meeting[]> {
        const results = await this.db.query.meetings.findMany({
            where: eq(schema.meetings.institutionId, institutionId.value),
            orderBy: (meetings, { desc }) => [desc(meetings.date)],
            with: {
                tasks: {
                    with: {
                        assignedStaff: true
                    }
                }
            }
        });

        return results.map(r => {
            const meeting = this.toDomain(r);
            if (r.tasks) {
                meeting.tasks = r.tasks.map(t => this.taskToDomain(t));
            }
            return meeting;
        });
    }

    async update(meeting: Meeting): Promise<Meeting> {
        await this.db.update(schema.meetings)
            .set({
                title: meeting.title,
                date: meeting.date,
                startTime: meeting.startTime,
                endTime: meeting.endTime,
                type: meeting.type,
                status: meeting.status,
                involvedActors: meeting.involvedActors,
                involvedAreas: meeting.involvedAreas,
                notes: meeting.notes,
                updatedAt: new Date(),
            })
            .where(eq(schema.meetings.id, meeting.id));
        return meeting;
    }

    async delete(id: string, institutionId: InstitutionId): Promise<boolean> {
        await this.db.transaction(async (tx) => {
            await tx.delete(schema.meetingTasks).where(eq(schema.meetingTasks.meetingId, id));
            await tx.delete(schema.meetings).where(and(
                eq(schema.meetings.id, id),
                eq(schema.meetings.institutionId, institutionId.value)
            ));
        });
        return true;
    }

    // Tasks
    async saveTask(task: MeetingTask): Promise<MeetingTask> {
        await this.db.insert(schema.meetingTasks).values({
            id: task.id,
            meetingId: task.meetingId,
            description: task.description,
            assignedStaffId: task.assignedStaffId,
            status: task.status,
            dueDate: task.dueDate,
        });
        return task;
    }

    async updateTask(task: MeetingTask): Promise<MeetingTask> {
        await this.db.update(schema.meetingTasks)
            .set({
                description: task.description,
                assignedStaffId: task.assignedStaffId,
                status: task.status,
                dueDate: task.dueDate,
                updatedAt: new Date(),
            })
            .where(eq(schema.meetingTasks.id, task.id));
        return task;
    }

    async deleteTask(taskId: string): Promise<boolean> {
        await this.db.delete(schema.meetingTasks).where(eq(schema.meetingTasks.id, taskId));
        return true;
    }

    async findTaskById(taskId: string): Promise<MeetingTask | null> {
        const result = await this.db.query.meetingTasks.findFirst({
            where: eq(schema.meetingTasks.id, taskId),
            with: {
                assignedStaff: true,
            },
        });
        if (!result) return null;
        return this.taskToDomain(result);
    }

    async findTasksByMeeting(meetingId: string): Promise<MeetingTask[]> {
        const results = await this.db.query.meetingTasks.findMany({
            where: eq(schema.meetingTasks.meetingId, meetingId),
            with: {
                assignedStaff: true,
            },
        });
        return results.map(r => this.taskToDomain(r));
    }
}
