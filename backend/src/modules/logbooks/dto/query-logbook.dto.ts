import { ApiPropertyOptional } from '@nestjs/swagger';
import { WeatherType } from '@prisma/client';
import { IsDateString, IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const LOGBOOK_DATE_PRESETS = ['today', 'week', 'month'] as const;

export const LOGBOOK_SORT = ['eventAt', 'title', 'createdAt', 'updatedAt', 'code'] as const;

export class QueryLogbookDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @ApiPropertyOptional({ enum: WeatherType })
  @IsOptional()
  @IsEnum(WeatherType)
  weather?: WeatherType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: LOGBOOK_DATE_PRESETS })
  @IsOptional()
  @IsIn(LOGBOOK_DATE_PRESETS)
  datePreset?: (typeof LOGBOOK_DATE_PRESETS)[number];

  @ApiPropertyOptional({ enum: LOGBOOK_SORT })
  sortBy?: (typeof LOGBOOK_SORT)[number];
}
