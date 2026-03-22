import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { MeetingsController } from '../infrastructure/http/controllers/meetings.controller';
import { DrizzleMeetingRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-meeting.repository';
import { CreateMeetingCommand } from '../application/use-cases/meetings/commands/create-meeting.command';
import { GetMeetingsQuery } from '../application/use-cases/meetings/queries/get-meetings.query';
import { CreateMeetingTaskCommand } from '../application/use-cases/meetings/commands/create-meeting-task.command';
import { UpdateMeetingTaskCommand } from '../application/use-cases/meetings/commands/update-meeting-task.command';
import { DeleteMeetingTaskCommand } from '../application/use-cases/meetings/commands/delete-meeting-task.command';

@Module({
    imports: [DatabaseModule],
    controllers: [MeetingsController],
    providers: [
        {
            provide: 'IMeetingRepository',
            useClass: DrizzleMeetingRepository,
        },
        CreateMeetingCommand,
        GetMeetingsQuery,
        CreateMeetingTaskCommand,
        UpdateMeetingTaskCommand,
        DeleteMeetingTaskCommand,
    ],
    exports: ['IMeetingRepository'],
})
export class MeetingsModule { }
