import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { UsersModule } from './users/users.module';
import { ResourceModule } from './modules/resource.module';
import { CategoriesModule } from './categories/categories.module';
import { ResourceTemplatesModule } from './resource-templates/resource-templates.module';
import { ExternalModule } from './infrastructure/external/external.module';
import { LoansModule } from './modules/loans.module';
import { PedagogicalHoursModule } from './pedagogical-hours/pedagogical-hours.module';
import { GradesModule } from './grades/grades.module';
import { SectionsModule } from './sections/sections.module';
import { CurricularAreasModule } from './curricular-areas/curricular-areas.module';
import { StaffModule } from './modules/staff/staff.module';
import { ReservationsModule } from './modules/reservations.module';
import { MeetingsModule } from './modules/meetings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ClassroomsModule } from './modules/classrooms.module';


@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // Database
        DatabaseModule,

        // Auth
        AuthModule,

        // Institutions (MINEDU registry)
        InstitutionsModule,

        // Feature modules (uncomment as you implement them)
        UsersModule,
        ResourceModule,
        CategoriesModule,
        ResourceTemplatesModule,
        ExternalModule,
        LoansModule,

        // Configuration modules
        PedagogicalHoursModule,
        GradesModule,
        SectionsModule,
        CurricularAreasModule,
        StaffModule,
        ClassroomsModule,
        ReservationsModule,
        MeetingsModule,
        DashboardModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
