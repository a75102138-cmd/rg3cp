import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoPhase } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { OptionalTakenAtField } from './optional-taken-at-field';

export class UploadPathologyPhotosBodyDto extends OptionalTakenAtField {
  @ApiProperty()
  @IsUUID()
  pathologyId: string;

  @ApiPropertyOptional({
    description: 'Sous-type métier (défaut : DETAIL si omis).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  photoType?: string;

  @ApiPropertyOptional({ enum: PhotoPhase, description: 'Phase chantier (optionnel).' })
  @IsOptional()
  @IsEnum(PhotoPhase)
  photoPhase?: PhotoPhase;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;
}
