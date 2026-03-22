import { Module } from '@nestjs/common';
import { ClassroomReservationsController } from '../infrastructure/http/controllers/classroom-reservations.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzleReservationRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-reservation.repository';
import { CreateReservationCommand } from '../application/use-cases/reservations/commands/create-reservation.command';
import { CancelReservationCommand } from '../application/use-cases/reservations/commands/cancel-reservation.command';
import { CancelSlotCommand } from '../application/use-cases/reservations/commands/cancel-slot.command';
import { MarkAttendanceCommand } from '../application/use-cases/reservations/commands/mark-attendance.command';
import { RescheduleSlotCommand } from '../application/use-cases/reservations/commands/reschedule-slot.command';
import { RescheduleBlockCommand } from '../application/use-cases/reservations/commands/reschedule-block.command';
import { FindReservationsQuery } from '../application/use-cases/reservations/queries/find-reservations.query';

@Module({
    imports: [DatabaseModule],
    controllers: [ClassroomReservationsController],
    providers: [
        {
            provide: 'IReservationRepository',
            useClass: DrizzleReservationRepository,
        },
        CreateReservationCommand,
        CancelReservationCommand,
        CancelSlotCommand,
        MarkAttendanceCommand,
        RescheduleSlotCommand,
        RescheduleBlockCommand,
        FindReservationsQuery,
    ],
    exports: ['IReservationRepository'],
})
export class ReservationsModule { }
