import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import {validateEnv} from "./config/env.validation";
import {DatabaseModule} from "./database/database.module";
import {CharacterModule} from "./modules/character/character.module";
import {UserModule} from "./modules/user/user.module";
import {AuthModule} from "./modules/auth/auth.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        DatabaseModule,
        CharacterModule,
        UserModule,
        AuthModule
    ],
    controllers: [AppController],
})
export class AppModule {}