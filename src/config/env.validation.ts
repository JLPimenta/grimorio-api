import {IsInt, IsOptional, IsString, validateSync} from "class-validator";
import {plainToInstance} from "class-transformer";

class EnvironmentVariables {

    @IsString()
    DATABASE_URL: string;

    @IsString()
    @IsOptional()
    FRONTEND_URL: string;

    @IsInt()
    @IsOptional()
    PORT: number = 3001;

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