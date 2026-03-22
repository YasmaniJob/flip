import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';

async function bootstrap() {
    // Use rawBody for Better Auth compatibility (not bodyParser: false)
    const app = await NestFactory.create(AppModule, { rawBody: true });

    // Enable gzip compression (70-80% payload reduction)
    app.use(compression({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        },
        level: 6, // Balance between compression ratio and CPU usage
        threshold: 1024, // Only compress responses > 1KB
    }));

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter for tracking 500 errors
    app.useGlobalFilters(new AllExceptionsFilter());

    // API prefix (exclude auth routes which are handled by Better Auth)
    app.setGlobalPrefix('api/v1', {
        exclude: ['api/auth', 'api/auth/(.*)'],
    });

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('Flip API')
        .setDescription('API para gestión de inventario y préstamos')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Start server
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Flip API running on http://localhost:${port}`);
}

bootstrap();
