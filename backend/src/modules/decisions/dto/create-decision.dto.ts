import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionStatus, DecisionType } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export const DOCTRINAL_PRINCIPLES_FR = [
  'Lisibilité',
  'Réversibilité',
  'Intervention minimale',
  'Authenticité',
  'Compatibilité des matériaux',
  'Conservation de la substance historique',
  'Distinguabilité',
  'Documentation préalable',
  'Stabilité structurelle',
  'Respect des techniques traditionnelles',
] as const;

export class CreateDecisionDto {
  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  observationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pathologyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pvDocumentId?: string;

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

  @ApiProperty({ enum: DecisionType })
  @IsEnum(DecisionType)
  decisionType: DecisionType;

  @ApiPropertyOptional({ enum: DecisionStatus })
  @IsOptional()
  @IsEnum(DecisionStatus)
  status?: DecisionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiPropertyOptional({ type: [String], enum: DOCTRINAL_PRINCIPLES_FR })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(DOCTRINAL_PRINCIPLES_FR, { each: true })
  doctrinalPrinciples?: string[];

}
