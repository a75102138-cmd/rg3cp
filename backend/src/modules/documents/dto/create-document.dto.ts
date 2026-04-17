import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  originalFilename: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  mimeType: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  url: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  secureUrl: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  publicId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  assetFolder: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  bytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  format?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  authorActorId?: string;

  @ApiPropertyOptional({ description: 'Date métier du document (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  documentDate?: string;
}
