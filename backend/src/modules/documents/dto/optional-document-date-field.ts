import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class OptionalDocumentDateField {
  @ApiPropertyOptional({
    description: 'Date métier du document (ISO 8601), distincte de la date d’upload.',
  })
  @IsOptional()
  @IsDateString()
  documentDate?: string;
}
