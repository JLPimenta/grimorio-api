import {IsInt, IsOptional, IsString, validateSync} from "class-validator";
import {plainToInstance} from "class-transformer";

class EnvironmentVariables {

    @IsString()
    DATABASE_URL: string;

    @IsString()
    JWT_SECRET: string;

    @IsString()
    @IsOptional()
    JWT_EXPIRES_IN: string = '7d';

    @IsString()
    @IsOptional()
    GOOGLE_CLIENT_ID: string;

    @IsString()
    @IsOptional()
    MAIL_HOST: string;

    @IsString()
    @IsOptional()
    MAIL_USER: string;

    @IsString()
    @IsOptional()
    MAIL_PASS: string;

    @IsString()
    @IsOptional()
    MAIL_FROM: string = 'Grimório <noreply@grimorio.app>';

    @IsString()
    @IsOptional()
    FRONTEND_URL: string = 'http://localhost:5173';

    @IsInt()
    @IsOptional()
    PORT: number = 3001;

    @IsString()
    RECAPTCHA_SECRET_KEY: string

}

export function validateEnv(config: Record<string, unknown>) {
    const validated = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validated);
    if (errors.length > 0) {
        throw new Error(`Variáveis de ambiente inválidas:\n${errors.toString()}`);
    }

    return validated;
}