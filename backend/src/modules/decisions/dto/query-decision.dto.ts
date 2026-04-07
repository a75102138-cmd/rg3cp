import { ApiPropertyOptional } from '@nestjs/swagger';
import { DecisionStatus, DecisionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const DECISION_SORT = ['code', 'title', 'decidedAt', 'status', 'createdAt', 'updatedAt'] as const;

export class QueryDecisionDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

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

  @ApiPropertyOptional({ enum: DecisionType })
  @IsOptional()
  @IsEnum(DecisionType)
  decisionType?: DecisionType;

  @ApiPropertyOptional({ enum: DecisionStatus })
  @IsOptional()
  @IsEnum(DecisionStatus)
  status?: DecisionStatus;

  @ApiPropertyOptional({ enum: DECISION_SORT })
  sortBy?: (typeof DECISION_SORT)[number];
}
