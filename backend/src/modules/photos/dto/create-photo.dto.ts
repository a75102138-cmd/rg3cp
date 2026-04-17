import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileKind, PhotoPhase } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePhotoDto {
  @ApiPropertyOptional({ enum: FileKind, default: FileKind.PHOTO })
  @IsOptional()
  @IsEnum(FileKind)
  fileKind?: FileKind;

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
  @IsString()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({ description: 'Sous-type métier (ex. vue générale, détail fissure)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  photoType?: string;

  @ApiPropertyOptional({ enum: PhotoPhase })
  @IsOptional()
  @IsEnum(PhotoPhase)
  photoPhase?: PhotoPhase;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  authorActorId?: string;

  @ApiPropertyOptional({
    description: 'Date réelle de prise de vue (ISO 8601), distincte de la date d’upload.',
  })
  @IsOptional()
  @IsString()
  takenAt?: string;
}
