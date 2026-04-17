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

export const DOCUMENT_DATE_PRESETS = ['today', 'week', 'month'] as const;

export const DOCUMENT_SORT = [
  'title',
  'originalFilename',
  'documentDate',
  'createdAt',
  'updatedAt',
] as const;

export class QueryDocumentDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Uniquement documents rattachés au projet (pas zone / observation / décision / …). */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  projectOnly?: boolean;

  /** Uniquement documents directement liés à la zone (pas observation / pathologie / décision / …). */
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
  observationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pathologyId?: string;

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

  @ApiPropertyOptional({ enum: DOCUMENT_SORT })
  sortBy?: (typeof DOCUMENT_SORT)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: DOCUMENT_DATE_PRESETS })
  @IsOptional()
  @IsIn(DOCUMENT_DATE_PRESETS)
  datePreset?: (typeof DOCUMENT_DATE_PRESETS)[number];

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
