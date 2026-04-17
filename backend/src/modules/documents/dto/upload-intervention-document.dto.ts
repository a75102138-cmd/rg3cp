import { ApiProperty } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OptionalDocumentDateField } from './optional-document-date-field';

export class UploadInterventionDocumentBodyDto extends OptionalDocumentDateField {
  @ApiProperty()
  @IsUUID()
  interventionId: string;

  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;
}
