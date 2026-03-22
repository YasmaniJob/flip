import { InstitutionId, generateId } from '@flip/shared';

export type MeetingStatus = 'active' | 'cancelled' | 'completed';
export type TaskStatus = 'pending' | 'completed';

export class Meeting {
    public tasks?: MeetingTask[];
    public facilitatorId?: string;

    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public title: string,
        public date: Date,
        public startTime: string | null,
        public endTime: string | null,
        public type: string,
        public status: MeetingStatus,
        public involvedActors: string[] = [],
        public involvedAreas: string[] = [],
        public notes: string | null,
        public readonly createdAt: Date | undefined,
        public readonly updatedAt: Date | undefined,
    ) { }

    static create(
        institutionId: InstitutionId,
        title: string,
        date: Date,
        startTime: string | null,
        endTime: string | null,
        type: string,
        involvedActors: string[] = [],
        involvedAreas: string[] = [],
        notes?: string
    ): Meeting {
        return new Meeting(
            generateId(),
            institutionId,
            title,
            date,
            startTime,
            endTime,
            type,
            'active',
            involvedActors,
            involvedAreas,
            notes || null,
            new Date(),
            new Date()
        );
    }
}

export class MeetingTask {
    constructor(
        public readonly id: string,
        public readonly meetingId: string,
        public description: string,
        public assignedStaffId: string | null,
        public status: TaskStatus,
        public dueDate: Date | null,
        public readonly assignedStaffName?: string,
    ) { }

    static create(meetingId: string, description: string, assignedStaffId: string | null, dueDate: Date | null): MeetingTask {
        return new MeetingTask(generateId(), meetingId, description, assignedStaffId, 'pending', dueDate);
    }
}
