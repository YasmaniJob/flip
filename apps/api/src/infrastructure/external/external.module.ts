import { Module, Global } from '@nestjs/common';
import { MineduService } from './minedu/minedu.service';

@Global()
@Module({
    providers: [
        {
            provide: 'IExternalInstitutionService',
            useClass: MineduService,
        },
    ],
    exports: ['IExternalInstitutionService'],
})
export class ExternalModule { }
