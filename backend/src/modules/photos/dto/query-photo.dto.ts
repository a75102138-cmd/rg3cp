import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const PHOTO_DATE_PRESETS = ['today', 'week', 'month'] as const;

export const PHOTO_SORT = [
  'title',
  'caption',
  'originalFilename',
  'takenAt',
  'createdAt',
  'updatedAt',
] as const;

export class QueryPhotoDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Uniquement photos rattachées au projet (pas zone / journal / observation / …). */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  projectOnly?: boolean;

  /** Uniquement photos directement liées à la zone (pas élément / observation / pathologie / intervention / journal). */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  zoneOnly?: boolean;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pathologyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  interventionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  logbookId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @ApiPropertyOptional({ enum: FileKind })
  @IsOptional()
  @IsEnum(FileKind)
  fileKind?: FileKind;

  @ApiPropertyOptional({ enum: PHOTO_SORT })
  sortBy?: (typeof PHOTO_SORT)[number];

  @ApiPropertyOptional({ description: 'Filtre sur date métier (prise ou upload si prise absente)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: PHOTO_DATE_PRESETS, description: 'Raccourci (prioritaire sur dateFrom/dateTo si fourni)' })
  @IsOptional()
  @IsIn(PHOTO_DATE_PRESETS)
  datePreset?: (typeof PHOTO_DATE_PRESETS)[number];

  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  subCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bddCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tableName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  subFolder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  relatedZoneId?: string;
}
