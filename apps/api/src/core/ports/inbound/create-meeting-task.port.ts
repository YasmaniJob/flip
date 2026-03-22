import { MeetingTask } from '../../domain/entities/meeting.entity';
import { TaskStatus } from '../../domain/entities/meeting.entity';

export interface CreateMeetingTaskInput {
    meetingId: string;
    description: string;
    assignedStaffId?: string;
    dueDate?: Date | string;
    status?: TaskStatus;
}

export interface CreateMeetingTaskPort {
    execute(input: CreateMeetingTaskInput): Promise<MeetingTask>;
}
