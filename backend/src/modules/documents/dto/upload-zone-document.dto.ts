import { ApiProperty } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OptionalDocumentDateField } from './optional-document-date-field';

export class UploadZoneDocumentBodyDto extends OptionalDocumentDateField {
  @ApiProperty()
  @IsUUID()
  zoneId: string;

  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;
}
