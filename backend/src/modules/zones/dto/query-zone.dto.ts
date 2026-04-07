import { ApiPropertyOptional } from '@nestjs/swagger';
import { ZoneType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const ZONE_SORT = ['code', 'name', 'type', 'createdAt', 'updatedAt'] as const;

export class QueryZoneDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentZoneId?: string;

  @ApiPropertyOptional({ enum: ZoneType })
  @IsOptional()
  @IsEnum(ZoneType)
  type?: ZoneType;

  @ApiPropertyOptional({ enum: ZONE_SORT })
  sortBy?: (typeof ZONE_SORT)[number];
}
