import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location: string;

  @ApiProperty({ description: 'ISO 8601 date (jour de début du projet)' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'ISO 8601 date (fin prévue), optionnel' })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @ApiProperty({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  maitreOuvrageActorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  architectActorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyActorId?: string;

  @ApiPropertyOptional({
    description: 'URL publique de l’image de couverture (sinon envoi via POST …/cover)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;
}
