import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: MaterialType })
  @IsEnum(MaterialType)
  type: MaterialType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  origin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  compatibility?: string;
}
