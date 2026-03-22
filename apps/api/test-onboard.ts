import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { InstitutionsService } from './src/institutions/institutions.service';

async function bootstrap() {
    console.log('Initializing app context...');
    const app = await NestFactory.createApplicationContext(AppModule);
    console.log('App context initialized.');

    const service = app.get(InstitutionsService);

    console.log('Calling onboardUser...');
    try {
        // We need a valid user ID. 
        // We will just pass a hardcoded random string. It should fail at user update if not found,
        // or it might throw the actual 500 error we are looking for.
        await service.onboardUser('test-user-123', {
            codigoModular: '1234567',
            nivel: 'primaria',
            isManual: true,
            nombre: 'Test Institution',
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Lima'
        });
        console.log('Successfully onboarded!');
    } catch (e) {
        console.error('FATAL ONBOARD ERROR:');
        console.error(e);
    }

    await app.close();
}

bootstrap();
