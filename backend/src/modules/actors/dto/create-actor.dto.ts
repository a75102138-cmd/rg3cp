import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActorRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateActorDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organization?: string;

  @ApiProperty({ enum: ActorRole })
  @IsEnum(ActorRole)
  role: ActorRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string;
}
