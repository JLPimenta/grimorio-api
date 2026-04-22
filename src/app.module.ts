import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import {validateEnv} from "./config/env.validation";
import {DatabaseModule} from "./database/database.module";
import {CharacterModule} from "./modules/character/character.module";
import {UserModule} from "./modules/user/user.module";
import {AuthModule} from "./modules/auth/auth.module";
import { MailModule } from './modules/mail/mail.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        ThrottlerModule.forRoot([{ 
            ttl: 60000, 
            limit: 100 
        }]),
        DatabaseModule,
        CharacterModule,
        UserModule,
        AuthModule,
        MailModule
    ],
    controllers: [AppController],
})
export class AppModule {}