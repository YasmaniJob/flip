import { Module } from '@nestjs/common';
import { ResourceTemplatesController } from './resource-templates.controller';
import { ResourceTemplatesService } from './resource-templates.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ResourceTemplatesController],
    providers: [ResourceTemplatesService],
    exports: [ResourceTemplatesService],
})
export class ResourceTemplatesModule { }
