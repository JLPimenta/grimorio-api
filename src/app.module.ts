import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import {validateEnv} from "./config/env.validation";
import {DatabaseModule} from "./database/database.module";
import {CharacterModule} from "./modules/character/character.module";
import {UserModule} from "./modules/user/user.module";
import {AuthModule} from "./modules/auth/auth.module";
import { MailModule } from './modules/mail/mail.module';
import {CsrfMiddleware} from './shared/middlewares/csrf.middleware';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        DatabaseModule,
        CharacterModule,
        UserModule,
        AuthModule,
        MailModule
    ],
    controllers: [AppController],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(CsrfMiddleware)
            .exclude(
                { path: 'auth/login', method: RequestMethod.POST },
                { path: 'auth/register', method: RequestMethod.POST },
                { path: 'auth/google', method: RequestMethod.POST },
                { path: 'auth/forgot-password', method: RequestMethod.POST },
                { path: 'auth/reset-password', method: RequestMethod.POST },
                { path: 'auth/confirm-email', method: RequestMethod.POST },
            )
            .forRoutes('*');
    }
}