import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: 'Mot de passe en clair — stocké haché' })
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
