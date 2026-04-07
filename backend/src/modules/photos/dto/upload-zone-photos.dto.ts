import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhotoPhase } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UploadZonePhotosBodyDto {
  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiProperty({ enum: PhotoPhase })
  @IsEnum(PhotoPhase)
  photoPhase: PhotoPhase;

  /** Type métier (ex. VUE_ENSEMBLE, DETAIL_PATHOLOGIE, …). */
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  photoType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;
}
