import { Inject, Injectable } from '@nestjs/common';
import { CreateMeetingTaskPort, CreateMeetingTaskInput } from '../../../../core/ports/inbound/create-meeting-task.port';
import { IMeetingRepository } from '../../../../core/ports/outbound/meeting.repository';
import { MeetingTask } from '../../../../core/domain/entities/meeting.entity';

@Injectable()
export class CreateMeetingTaskCommand implements CreateMeetingTaskPort {
    constructor(
        @Inject('IMeetingRepository')
        private readonly meetingRepo: IMeetingRepository,
    ) { }

    async execute(input: CreateMeetingTaskInput): Promise<MeetingTask> {
        const task = MeetingTask.create(
            input.meetingId,
            input.description,
            input.assignedStaffId || null,
            input.dueDate ? new Date(input.dueDate) : null
        );

        if (input.status) {
            task.status = input.status;
        }

        return this.meetingRepo.saveTask(task);
    }
}
