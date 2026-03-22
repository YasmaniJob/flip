import { InstitutionId } from '@flip/shared';

export class PedagogicalHour {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public name: string,
        public startTime: string,
        public endTime: string,
        public sortOrder: number = 0,
        public isBreak: boolean = false,
        public active: boolean = true,
        public readonly createdAt?: Date,
    ) { }

    static create(
        id: string,
        institutionId: InstitutionId,
        name: string,
        startTime: string,
        endTime: string,
        sortOrder: number = 0,
        isBreak: boolean = false,
    ): PedagogicalHour {
        return new PedagogicalHour(id, institutionId, name, startTime, endTime, sortOrder, isBreak, true, new Date());
    }
}
