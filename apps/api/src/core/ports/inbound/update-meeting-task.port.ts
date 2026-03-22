import { MeetingTask } from '../../domain/entities/meeting.entity';
import { TaskStatus } from '../../domain/entities/meeting.entity';

export interface UpdateMeetingTaskInput {
    taskId: string;
    description?: string;
    assignedStaffId?: string;
    dueDate?: Date | string;
    status?: TaskStatus;
}

export interface UpdateMeetingTaskPort {
    execute(input: UpdateMeetingTaskInput): Promise<MeetingTask>;
}
