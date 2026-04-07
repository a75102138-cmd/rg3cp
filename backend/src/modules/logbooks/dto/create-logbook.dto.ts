import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeatherType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLogbookDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Titre de l’entrée' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({ description: 'Date et heure de l’événement (ISO 8601)' })
  @IsDateString()
  eventAt: string;

  @ApiPropertyOptional({ description: 'Description / compte rendu' })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  authorActorId?: string;

  @ApiPropertyOptional({ enum: WeatherType })
  @IsOptional()
  @IsEnum(WeatherType)
  weather?: WeatherType;

  @ApiPropertyOptional({ description: 'Effectif' })
  @IsOptional()
  @IsInt()
  @Min(0)
  workforce?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  decisionIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  interventionIds?: string[];
}
