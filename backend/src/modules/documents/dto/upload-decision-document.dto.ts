import { ApiProperty } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OptionalDocumentDateField } from './optional-document-date-field';

export class UploadDecisionDocumentBodyDto extends OptionalDocumentDateField {
  @ApiProperty()
  @IsUUID()
  decisionId: string;

  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;
}
