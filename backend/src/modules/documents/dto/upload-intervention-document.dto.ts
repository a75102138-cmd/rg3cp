import { ApiProperty } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class UploadInterventionDocumentBodyDto {
  @ApiProperty()
  @IsUUID()
  interventionId: string;

  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;
}
