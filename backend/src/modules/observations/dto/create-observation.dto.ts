import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObservationType, SeverityLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateObservationDto {
  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  elementId?: string;

  @ApiPropertyOptional({ description: 'Auteur ou responsable de la constatation (texte libre)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @ApiPropertyOptional({ description: 'Acteur auteur (référentiel Acteurs)' })
  @IsOptional()
  @IsUUID()
  authorActorId?: string;

  @ApiPropertyOptional({ description: 'Généré automatiquement si omis (unique par zone).' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiProperty({ enum: ObservationType })
  @IsEnum(ObservationType)
  observationType: ObservationType;

  @ApiPropertyOptional({ enum: SeverityLevel })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

}
