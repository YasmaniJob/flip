import { Module } from '@nestjs/common';
import { CurricularAreasController } from '../infrastructure/http/controllers/curricular-areas.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzleCurricularAreaRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-curricular-area.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [CurricularAreasController],
    providers: [
        {
            provide: 'ICurricularAreaRepository',
            useClass: DrizzleCurricularAreaRepository,
        },
    ],
    exports: ['ICurricularAreaRepository'],
})
export class CurricularAreasModule { }
