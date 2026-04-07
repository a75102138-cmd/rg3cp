import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'CHANTIER_EDITOR' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
