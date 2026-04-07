import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LabTestResult, LabTestType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLabTestDto {
  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  laboratoryName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  laboratoryActorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiProperty({ enum: LabTestType })
  @IsEnum(LabTestType)
  labTestType: LabTestType;

  @ApiPropertyOptional({ enum: LabTestResult })
  @IsOptional()
  @IsEnum(LabTestResult)
  result?: LabTestResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  testedAt?: string;
}
