import { InstitutionId } from '@flip/shared';

export class Section {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public name: string,
        public gradeId: string,
        public areaId?: string | null,
        public studentCount?: number | null,
        public readonly createdAt?: Date,
    ) { }

    static create(
        id: string,
        institutionId: InstitutionId,
        name: string,
        gradeId: string,
        studentCount?: number,
    ): Section {
        return new Section(id, institutionId, name, gradeId, null, studentCount, new Date());
    }
}
