import { ApiPropertyOptional } from '@nestjs/swagger';
import { HeritageSensitivity, ZoneType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Mise à jour partielle — pas de `projectId` ni de `code`. */
export class UpdateZoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ enum: ZoneType })
  @IsOptional()
  @IsEnum(ZoneType)
  type?: ZoneType;

  @ApiPropertyOptional({ nullable: true, description: 'null pour détacher la zone parente' })
  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string')
  @IsUUID()
  parentZoneId?: string | null;

  @ApiPropertyOptional({ enum: HeritageSensitivity, nullable: true, description: 'null pour effacer' })
  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string')
  @IsEnum(HeritageSensitivity)
  heritageSensitivity?: HeritageSensitivity | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;
}
