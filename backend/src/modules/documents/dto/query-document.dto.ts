import { ApiPropertyOptional } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const DOCUMENT_SORT = ['title', 'originalFilename', 'createdAt', 'updatedAt'] as const;

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
}
