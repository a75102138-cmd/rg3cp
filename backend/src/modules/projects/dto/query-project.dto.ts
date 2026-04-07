import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const PROJECT_SORT = [
  'code',
  'name',
  'status',
  'createdAt',
  'updatedAt',
  'startDate',
  'plannedEndDate',
] as const;

export class QueryProjectDto extends BaseListQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: PROJECT_SORT })
  sortBy?: (typeof PROJECT_SORT)[number];
}
