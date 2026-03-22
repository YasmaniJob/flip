import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMeetingTaskPort, UpdateMeetingTaskInput } from '../../../../core/ports/inbound/update-meeting-task.port';
import { IMeetingRepository } from '../../../../core/ports/outbound/meeting.repository';
import { MeetingTask } from '../../../../core/domain/entities/meeting.entity';

@Injectable()
export class UpdateMeetingTaskCommand implements UpdateMeetingTaskPort {
    constructor(
        @Inject('IMeetingRepository')
        private readonly meetingRepo: IMeetingRepository,
    ) { }

    async execute(input: UpdateMeetingTaskInput): Promise<MeetingTask> {
        const task = await this.meetingRepo.findTaskById(input.taskId);
        if (!task) {
            throw new NotFoundException(`Task with ID ${input.taskId} not found`);
        }

        if (input.description !== undefined) task.description = input.description;
        if (input.assignedStaffId !== undefined) {
            task.assignedStaffId = input.assignedStaffId || null;
        }
        if (input.status !== undefined) task.status = input.status;
        if (input.dueDate !== undefined) {
            task.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        }

        return this.meetingRepo.updateTask(task);
    }
}
