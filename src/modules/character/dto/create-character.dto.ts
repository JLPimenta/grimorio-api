import {IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {SYSTEM_IDS} from '../systems/system.types';

export class CreateCharacterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(255)
    name: string;

    /**
     * Opcional por compatibilidade com clientes antigos (default: dnd5_5e).
     * IsIn aceita todos os ids conhecidos; o service rejeita os que ainda
     * não estão registrados.
     */
    @IsOptional()
    @IsIn(SYSTEM_IDS as unknown as string[])
    system?: string;
}
