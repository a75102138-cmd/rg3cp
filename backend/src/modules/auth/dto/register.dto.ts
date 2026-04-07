import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
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

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password: string;
}

