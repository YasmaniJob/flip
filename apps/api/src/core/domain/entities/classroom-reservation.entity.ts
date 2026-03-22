import { InstitutionId, generateId } from '@flip/shared';

export type ReservationStatus = 'active' | 'cancelled';

export interface ReservationSlot {
    id: string;
    pedagogicalHourId: string;
    date: Date;
    attended: boolean;
    attendedAt: Date | null;
}

export class ClassroomReservation {
    constructor(
        public readonly id: string,
        public readonly institutionId: InstitutionId,
        public readonly staffId: string,
        public readonly gradeId: string | null,
        public readonly sectionId: string | null,
        public readonly curricularAreaId: string | null,
        public readonly purpose: string | null,
        public status: ReservationStatus,
        public readonly createdAt: Date,
        public cancelledAt: Date | null,
        public slots: ReservationSlot[] = [],
        public readonly type: 'class' | 'workshop' = 'class',
        public readonly title: string | null = null,
        public readonly classroomId: string | null = null,
    ) { }

    static create(
        institutionId: InstitutionId,
        staffId: string,
        slots: { pedagogicalHourId: string; date: Date }[],
        gradeId?: string,
        sectionId?: string,
        curricularAreaId?: string,
        purpose?: string,
        type: 'class' | 'workshop' = 'class',
        title?: string,
        classroomId?: string
    ): ClassroomReservation {
        return new ClassroomReservation(
            generateId(),
            institutionId,
            staffId,
            gradeId || null,
            sectionId || null,
            curricularAreaId || null,
            purpose || null,
            'active',
            new Date(),
            null,
            slots.map(s => ({
                id: generateId(),
                pedagogicalHourId: s.pedagogicalHourId,
                date: s.date,
                attended: false,
                attendedAt: null,
            })),
            type,
            title || null,
            classroomId || null
        );
    }

    cancel() {
        this.status = 'cancelled';
        this.cancelledAt = new Date();
    }
}

