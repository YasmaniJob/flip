import { Module } from '@nestjs/common';
import { GradesController } from '../infrastructure/http/controllers/grades.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzleGradeRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-grade.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [GradesController],
    providers: [
        {
            provide: 'IGradeRepository',
            useClass: DrizzleGradeRepository,
        },
    ],
    exports: ['IGradeRepository'],
})
export class GradesModule { }
