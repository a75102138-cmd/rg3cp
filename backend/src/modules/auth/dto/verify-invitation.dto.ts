import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyInvitationDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  token: string;
}
