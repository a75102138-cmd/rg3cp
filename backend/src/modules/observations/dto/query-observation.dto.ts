import { ApiPropertyOptional } from '@nestjs/swagger';
import { ObservationType, SeverityLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const OBSERVATION_SORT = ['code', 'title', 'observedAt', 'createdAt', 'updatedAt'] as const;

export class QueryObservationDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  elementId?: string;

  @ApiPropertyOptional({ description: 'Filtre texte sur le nom d’auteur' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @ApiPropertyOptional({ enum: ObservationType })
  @IsOptional()
  @IsEnum(ObservationType)
  observationType?: ObservationType;

  @ApiPropertyOptional({ enum: SeverityLevel })
  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @ApiPropertyOptional({ enum: OBSERVATION_SORT })
  sortBy?: (typeof OBSERVATION_SORT)[number];
}
