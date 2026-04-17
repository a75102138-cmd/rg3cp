import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { OptionalTakenAtField } from './optional-taken-at-field';

export class UploadJournalPhotosBodyDto extends OptionalTakenAtField {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  logbookId: string;
}
