import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterventionStatus, InterventionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const INTERVENTION_SORT = ['code', 'status', 'plannedStart', 'plannedEnd', 'createdAt', 'updatedAt'] as const;

export class QueryInterventionDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  decisionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  elementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pathologyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional({ enum: InterventionType })
  @IsOptional()
  @IsEnum(InterventionType)
  interventionType?: InterventionType;

  @ApiPropertyOptional({ enum: InterventionStatus })
  @IsOptional()
  @IsEnum(InterventionStatus)
  status?: InterventionStatus;

  @ApiPropertyOptional({ enum: INTERVENTION_SORT })
  sortBy?: (typeof INTERVENTION_SORT)[number];
}
