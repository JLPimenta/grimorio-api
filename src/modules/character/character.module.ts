import { Module } from '@nestjs/common';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import { CharacterRepository } from './character.repository';
import {AuthModule} from "../auth/auth.module";

@Module({
    imports: [AuthModule],
    controllers: [CharacterController],
    providers: [CharacterService, CharacterRepository],
    exports: [CharacterService]
})
export class CharacterModule {}