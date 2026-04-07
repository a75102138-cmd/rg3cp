import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UploadJournalPhotosBodyDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsUUID()
  logbookId: string;
}
