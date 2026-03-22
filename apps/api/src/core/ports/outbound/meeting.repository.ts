import { InstitutionId } from '@flip/shared';
import { Meeting, MeetingTask } from '../../domain/entities/meeting.entity';

export interface IMeetingRepository {
    save(meeting: Meeting): Promise<Meeting>;
    findById(id: string, institutionId: InstitutionId): Promise<Meeting | null>;
    findAll(institutionId: InstitutionId): Promise<Meeting[]>;
    update(meeting: Meeting): Promise<Meeting>;
    delete(id: string, institutionId: InstitutionId): Promise<boolean>;

    // Tasks
    saveTask(task: MeetingTask): Promise<MeetingTask>;
    updateTask(task: MeetingTask): Promise<MeetingTask>;
    deleteTask(taskId: string): Promise<boolean>;
    findTaskById(taskId: string): Promise<MeetingTask | null>;
    findTasksByMeeting(meetingId: string): Promise<MeetingTask[]>;
}
