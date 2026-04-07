import { ApiPropertyOptional } from '@nestjs/swagger';
import { PathologyType, SeverityLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const PATHOLOGY_SORT = ['code', 'pathologyType', 'createdAt', 'updatedAt'] as const;

export class QueryPathologyDto extends BaseListQueryDto {
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
  observationId?: string;

  @ApiPropertyOptional({ enum: PathologyType })
  @IsOptional()
  @IsEnum(PathologyType)
  pathologyType?: PathologyType;

  @ApiPropertyOptional({ enum: SeverityLevel })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @ApiPropertyOptional({ enum: PATHOLOGY_SORT })
  sortBy?: (typeof PATHOLOGY_SORT)[number];
}
