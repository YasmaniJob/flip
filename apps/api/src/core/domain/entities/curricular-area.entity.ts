import { InstitutionId } from '@flip/shared';

export class CurricularArea {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public name: string,
        public levels?: ('primaria' | 'secundaria')[] | null,
        public isStandard: boolean = false,
        public active: boolean = true,
        public readonly createdAt?: Date,
    ) { }

    static create(
        id: string,
        institutionId: InstitutionId,
        name: string,
        levels?: ('primaria' | 'secundaria')[],
        isStandard: boolean = false,
    ): CurricularArea {
        return new CurricularArea(id, institutionId, name, levels, isStandard, true, new Date());
    }
}
