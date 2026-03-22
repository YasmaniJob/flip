import { Inject, Injectable } from '@nestjs/common';
import { GetMeetingsPort } from '../../../../core/ports/inbound/get-meetings.port';
import { IMeetingRepository } from '../../../../core/ports/outbound/meeting.repository';
import { Meeting } from '../../../../core/domain/entities/meeting.entity';
import { InstitutionId } from '@flip/shared';

@Injectable()
export class GetMeetingsQuery implements GetMeetingsPort {
    constructor(
        @Inject('IMeetingRepository')
        private readonly meetingRepo: IMeetingRepository,
    ) { }

    async execute(institutionId: string): Promise<Meeting[]> {
        return await this.meetingRepo.findAll(InstitutionId.fromString(institutionId));
    }
}
