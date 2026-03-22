import { InstitutionId } from '@flip/shared';

export class Grade {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public name: string,
        public level: 'primaria' | 'secundaria',
        public sortOrder: number = 0,
        public readonly createdAt?: Date,
    ) { }

    static create(
        id: string,
        institutionId: InstitutionId,
        name: string,
        level: 'primaria' | 'secundaria',
        sortOrder: number = 0,
    ): Grade {
        return new Grade(id, institutionId, name, level, sortOrder, new Date());
    }
}
