import {IsBoolean, IsOptional, IsString} from 'class-validator';

export class GoogleAuthDto {
    @IsString()
    credential: string;

    @IsBoolean()
    acceptTerms: boolean;

    @IsString()
    @IsOptional()
    nonce?: string;
}