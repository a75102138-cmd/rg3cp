import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoPhase } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { OptionalTakenAtField } from './optional-taken-at-field';

const OBSERVATION_PHOTO_TYPES = [
  'VUE_ENSEMBLE',
  'DETAIL_PATHOLOGIE',
  'DETAIL_INTERVENTION',
  'COMPARATIF_AVANT_APRES',
  'AUTRE',
] as const;

export class UploadObservationPhotosBodyDto extends OptionalTakenAtField {
  @ApiProperty()
  @IsUUID()
  observationId: string;

  @ApiProperty({ enum: PhotoPhase })
  @IsEnum(PhotoPhase)
  photoPhase: PhotoPhase;

  @ApiProperty({ enum: OBSERVATION_PHOTO_TYPES, description: 'Type de photo obligatoire.' })
  @IsString()
  @IsIn(OBSERVATION_PHOTO_TYPES)
  @MaxLength(128)
  photoType: string;

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
