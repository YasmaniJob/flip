import { Meeting } from '../../domain/entities/meeting.entity';

export interface CreateMeetingInput {
    institutionId: string;
    title: string;
    date: Date;
    startTime: string | null;
    endTime: string | null;
    type: string;
    involvedActors?: string[];
    involvedAreas?: string[];
    notes?: string;
    tasks?: { description: string }[];
}

export interface CreateMeetingPort {
    execute(input: CreateMeetingInput): Promise<Meeting>;
}
