import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {AppModule} from './app.module';
import {AllExceptionsFilter} from "./shared/filters/http-exception.filter";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    app.enableCors({
        origin: process.env.FRONTEND_URL ?? '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
        }),
    );

    app.useGlobalFilters(new AllExceptionsFilter())

    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`API rodando em http://localhost:${port}/api`);
}

bootstrap();