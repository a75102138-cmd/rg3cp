import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ElementType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateElementDto {
  @ApiProperty({ description: 'Zone parente (injectée depuis le contexte zone côté UI).' })
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional({ description: 'Généré automatiquement si omis (unique par zone).' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiProperty({ description: 'Nom élément' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ElementType, description: 'Type élément' })
  @IsEnum(ElementType)
  elementType: ElementType;

  @ApiProperty({ description: 'Matériau principal (référence catalogue Matériaux)' })
  @IsUUID()
  materialId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
}
