import { ApiPropertyOptional } from '@nestjs/swagger';
import { RiskCategory, RiskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const RISK_SORT = ['title', 'status', 'createdAt', 'updatedAt'] as const;

export class QueryRiskDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  decisionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  interventionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerName?: string;

  @ApiPropertyOptional({ enum: RiskStatus })
  @IsOptional()
  @IsEnum(RiskStatus)
  status?: RiskStatus;

  @ApiPropertyOptional({ enum: RiskCategory })
  @IsOptional()
  @IsEnum(RiskCategory)
  riskCategory?: RiskCategory;

  @ApiPropertyOptional({ enum: RISK_SORT })
  sortBy?: (typeof RISK_SORT)[number];
}
