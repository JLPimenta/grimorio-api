import {IsBoolean, IsString} from 'class-validator';

export class GoogleAuthDto {
    @IsString()
    credential: string;

    @IsBoolean()
    acceptTerms: boolean;
}