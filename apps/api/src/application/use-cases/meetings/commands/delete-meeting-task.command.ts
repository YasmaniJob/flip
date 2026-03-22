import { Inject, Injectable } from '@nestjs/common';
import { IMeetingRepository } from '../../../../core/ports/outbound/meeting.repository';

@Injectable()
export class DeleteMeetingTaskCommand {
    constructor(
        @Inject('IMeetingRepository')
        private readonly meetingRepo: IMeetingRepository,
    ) { }

    async execute(taskId: string): Promise<boolean> {
        return this.meetingRepo.deleteTask(taskId);
    }
}
