import {IsNotEmpty, IsString, MinLength} from 'class-validator';

export class CreateCharacterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    name: string;
}