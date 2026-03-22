import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Inject } from '@nestjs/common';
import { InstitutionId } from '@flip/shared';
import { CreateMeetingCommand } from '../../../application/use-cases/meetings/commands/create-meeting.command';
import { GetMeetingsQuery } from '../../../application/use-cases/meetings/queries/get-meetings.query';
import { CreateMeetingTaskCommand } from '../../../application/use-cases/meetings/commands/create-meeting-task.command';
import { UpdateMeetingTaskCommand } from '../../../application/use-cases/meetings/commands/update-meeting-task.command';
import { DeleteMeetingTaskCommand } from '../../../application/use-cases/meetings/commands/delete-meeting-task.command';
import { IMeetingRepository } from '../../../core/ports/outbound/meeting.repository';
import { AuthGuard } from '../../../auth/auth.guard';
import { CurrentInstitution } from '../../../common/decorators/current-institution.decorator';

@Controller('meetings')
@UseGuards(AuthGuard)
export class MeetingsController {
    constructor(
        private readonly createMeetingCmd: CreateMeetingCommand,
        private readonly getMeetingsQuery: GetMeetingsQuery,
        private readonly createMeetingTaskCmd: CreateMeetingTaskCommand,
        private readonly updateMeetingTaskCmd: UpdateMeetingTaskCommand,
        private readonly deleteMeetingTaskCmd: DeleteMeetingTaskCommand,
        @Inject('IMeetingRepository')
        private readonly meetingRepo: IMeetingRepository,
    ) { }

    @Post()
    async create(@Body() input: any, @CurrentInstitution() institutionId: InstitutionId) {
        return this.createMeetingCmd.execute({
            ...input,
            institutionId: institutionId.toString(),
        });
    }

    @Get()
    async findAll(@CurrentInstitution() institutionId: InstitutionId) {
        return this.getMeetingsQuery.execute(institutionId.toString());
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentInstitution() institutionId: InstitutionId) {
        return this.meetingRepo.findById(id, institutionId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentInstitution() institutionId: InstitutionId) {
        return this.meetingRepo.delete(id, institutionId);
    }

    @Post(':id/tasks')
    async createTask(@Param('id') meetingId: string, @Body() body: any) {
        return this.createMeetingTaskCmd.execute({
            meetingId,
            description: body.description,
            assignedStaffId: body.assignedStaffId,
            dueDate: body.dueDate,
            status: body.status
        });
    }

    @Patch('tasks/:taskId')
    async updateTask(@Param('taskId') taskId: string, @Body() body: any) {
        return this.updateMeetingTaskCmd.execute({
            taskId,
            ...body
        });
    }

    @Delete('tasks/:taskId')
    async deleteTask(@Param('taskId') taskId: string) {
        return this.deleteMeetingTaskCmd.execute(taskId);
    }
}
