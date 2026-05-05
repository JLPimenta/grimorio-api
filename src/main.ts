import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {ValidationPipe} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import {AppModule} from './app.module';
import {CsrfGuard} from "./modules/auth/guards/csrf.guard";
import {AllExceptionsFilter} from "./shared/filters/http-exception.filter";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    app.set('trust proxy', 1);

    app.setGlobalPrefix('api');
    app.use(cookieParser());

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
        throw new Error('FRONTEND_URL environment variable must be set');
    }

    app.enableCors({
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-xsrf-token'],
        credentials: true,
    });

    app.useGlobalGuards(new CsrfGuard());

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