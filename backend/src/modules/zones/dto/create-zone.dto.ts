import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HeritageSensitivity, ZoneType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * Création de zone. `projectId` est fourni par le client depuis le contexte (route projet), pas saisi comme libellé « choix de projet ».
 * `code` est toujours généré côté serveur.
 */
export class CreateZoneDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentZoneId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ZoneType, description: 'Catégorie spatiale (chantier / patrimoine)' })
  @IsEnum(ZoneType)
  type: ZoneType;

  @ApiPropertyOptional({ enum: HeritageSensitivity })
  @IsOptional()
  @IsEnum(HeritageSensitivity)
  heritageSensitivity?: HeritageSensitivity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
}
