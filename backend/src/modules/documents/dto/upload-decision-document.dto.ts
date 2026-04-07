import { ApiProperty } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class UploadDecisionDocumentBodyDto {
  @ApiProperty()
  @IsUUID()
  decisionId: string;

  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;
}
