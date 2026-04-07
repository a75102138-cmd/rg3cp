import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RiskCategory,
  RiskImpact,
  RiskProbability,
  RiskStatus,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateRiskDto {
  @ApiPropertyOptional({ description: 'Référence métier unique si renseignée' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RiskCategory })
  @IsEnum(RiskCategory)
  riskCategory: RiskCategory;

  @ApiPropertyOptional({ enum: RiskProbability })
  @IsOptional()
  @IsEnum(RiskProbability)
  probability?: RiskProbability;

  @ApiPropertyOptional({ enum: RiskImpact })
  @IsOptional()
  @IsEnum(RiskImpact)
  impact?: RiskImpact;

  @ApiPropertyOptional({ enum: RiskStatus })
  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mitigation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  projectId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  zoneId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  decisionId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  interventionId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerName?: string;
}
