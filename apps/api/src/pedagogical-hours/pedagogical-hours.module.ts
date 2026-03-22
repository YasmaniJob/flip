import { Module } from '@nestjs/common';
import { PedagogicalHoursController } from '../infrastructure/http/controllers/pedagogical-hours.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzlePedagogicalHourRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-pedagogical-hour.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [PedagogicalHoursController],
    providers: [
        {
            provide: 'IPedagogicalHourRepository',
            useClass: DrizzlePedagogicalHourRepository,
        },
    ],
    exports: ['IPedagogicalHourRepository'],
})
export class PedagogicalHoursModule { }
