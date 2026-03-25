import {forwardRef, Module} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import {CharacterModule} from "../character/character.module";

@Module({
    imports:   [forwardRef(() => CharacterModule)],
    providers: [UserService, UserRepository],
    exports:   [UserService],
})
export class UserModule {}