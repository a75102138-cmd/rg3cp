import { ApiPropertyOptional } from '@nestjs/swagger';
import { LabTestType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { BaseListQueryDto } from '../../../common/dto/base-list-query.dto';

export const LAB_TEST_SORT = ['code', 'testedAt', 'createdAt', 'updatedAt'] as const;

export class QueryLabTestDto extends BaseListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  laboratoryName?: string;

  @ApiPropertyOptional({ enum: LabTestType })
  @IsOptional()
  @IsEnum(LabTestType)
  labTestType?: LabTestType;

  @ApiPropertyOptional({ enum: LAB_TEST_SORT })
  sortBy?: (typeof LAB_TEST_SORT)[number];
}
