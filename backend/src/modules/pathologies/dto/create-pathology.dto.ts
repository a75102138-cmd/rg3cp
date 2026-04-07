import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PathologyType, SeverityLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePathologyDto {
  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  elementId?: string;

  @ApiProperty({ description: 'Observation parente (contexte obligatoire).' })
  @IsUUID()
  observationId: string;

  @ApiPropertyOptional({ description: 'Généré automatiquement si omis (unique par zone).' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiProperty({ description: 'Nom pathologie' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: PathologyType })
  @IsEnum(PathologyType)
  pathologyType: PathologyType;

  @ApiProperty({ enum: SeverityLevel })
  @IsEnum(SeverityLevel)
  severity: SeverityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
