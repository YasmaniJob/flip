import { Meeting } from '../../domain/entities/meeting.entity';

export interface GetMeetingsPort {
    execute(institutionId: string): Promise<Meeting[]>;
}
