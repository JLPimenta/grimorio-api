import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import {validateEnv} from "./config/env.validation";
import {DatabaseModule} from "./database/database.module";
import {CharacterModule} from "./modules/character/character.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        DatabaseModule,
        CharacterModule
    ],
    controllers: [AppController],
})
export class AppModule {}