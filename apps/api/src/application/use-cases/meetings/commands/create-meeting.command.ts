import { Inject, Injectable } from '@nestjs/common';
import { CreateMeetingPort, CreateMeetingInput } from '../../../../core/ports/inbound/create-meeting.port';
import { IMeetingRepository } from '../../../../core/ports/outbound/meeting.repository';
import { Meeting, MeetingTask } from '../../../../core/domain/entities/meeting.entity';
import { InstitutionId } from '@flip/shared';

@Injectable()
export class CreateMeetingCommand implements CreateMeetingPort {
    constructor(
        @Inject('IMeetingRepository')
        private readonly meetingRepo: IMeetingRepository,
    ) { }

    async execute(input: CreateMeetingInput): Promise<Meeting> {
        const meeting = Meeting.create(
            InstitutionId.fromString(input.institutionId),
            input.title,
            new Date(input.date),
            input.startTime,
            input.endTime,
            input.type,
            input.involvedActors || [],
            input.involvedAreas || [],
            input.notes
        );

        const savedMeeting = await this.meetingRepo.save(meeting);

        // Save initial tasks
        if (input.tasks && input.tasks.length > 0) {
            for (const taskInput of input.tasks) {
                const task = MeetingTask.create(
                    meeting.id,
                    taskInput.description,
                    null,
                    null
                );
                await this.meetingRepo.saveTask(task);
            }
        }

        return savedMeeting;
    }
}
