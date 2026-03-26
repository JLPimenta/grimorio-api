import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    captchaToken: string;
}