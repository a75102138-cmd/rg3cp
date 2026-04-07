import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateDecisionDto } from './create-decision.dto';

export class UpdateDecisionDto extends PartialType(CreateDecisionDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  decidedAt?: string | null;
}
