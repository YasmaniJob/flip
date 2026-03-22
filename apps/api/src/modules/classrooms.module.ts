import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ClassroomsController } from '../infrastructure/http/controllers/classrooms.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [ClassroomsController],
})
export class ClassroomsModule {}
