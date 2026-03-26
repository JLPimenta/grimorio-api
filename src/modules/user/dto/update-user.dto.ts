import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @MaxLength(255)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    avatarUrl?: string;
}