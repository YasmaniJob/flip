import { Module } from '@nestjs/common';
import { SectionsController } from '../infrastructure/http/controllers/sections.controller';
import { DatabaseModule } from '../database/database.module';
import { DrizzleSectionRepository } from '../infrastructure/persistence/drizzle/repositories/drizzle-section.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [SectionsController],
    providers: [
        {
            provide: 'ISectionRepository',
            useClass: DrizzleSectionRepository,
        },
    ],
    exports: ['ISectionRepository'],
})
export class SectionsModule { }
