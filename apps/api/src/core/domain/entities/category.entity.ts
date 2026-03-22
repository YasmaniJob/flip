import { InstitutionId } from '@flip/shared';

export class Category {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public name: string,
        public icon?: string | null,
        public color?: string | null,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) { }

    static create(id: string, institutionId: InstitutionId, name: string, icon?: string | null, color?: string | null): Category {
        return new Category(id, institutionId, name, icon, color, new Date(), new Date());
    }
}
