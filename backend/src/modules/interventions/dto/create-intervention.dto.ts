import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterventionStatus, InterventionType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateInterventionDto {
  @ApiProperty()
  @IsUUID()
  decisionId: string;

  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  elementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  pathologyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyActorId?: string;

  @ApiPropertyOptional({
    description: 'Généré automatiquement si omis (unique par décision, ex. INT-001).',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @ApiProperty({ enum: InterventionType })
  @IsEnum(InterventionType)
  interventionType: InterventionType;

  @ApiPropertyOptional({ enum: InterventionStatus })
  @IsOptional()
  @IsEnum(InterventionStatus)
  status?: InterventionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedEnd?: string;
}
