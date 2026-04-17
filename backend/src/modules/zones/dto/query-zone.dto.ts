import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const ZONE_SORT = ['code', 'name', 'createdAt', 'updatedAt'] as const;

export class QueryZoneDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ enum: ZONE_SORT })
  sortBy?: (typeof ZONE_SORT)[number];
}
