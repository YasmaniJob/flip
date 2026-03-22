import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DashboardService } from './src/dashboard/dashboard.service';

async function bootstrap() {
    console.log('Initializing app context...');
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    console.log('App context initialized.');

    const service = app.get(DashboardService);

    console.log('Calling getInstitutionStats...');
    try {
        // Querying with a dummy ID to see if the SQL syntax crashes Drizzle
        const stats = await service.getInstitutionStats('dummy-institution-id-12345');
        console.log('SUCCESS! Stats:', stats);
    } catch (e) {
        console.error('FATAL DASHBOARD ERROR:');
        console.error(e);
    }

    await app.close();
}

bootstrap();
