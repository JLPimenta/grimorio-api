import { IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  autoSave?: boolean;

  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: string;
}
