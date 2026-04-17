import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileKind } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { OptionalDocumentDateField } from './optional-document-date-field';

export class UploadDocumentUnifiedDto extends OptionalDocumentDateField {
  @ApiProperty({ enum: FileKind })
  @IsEnum(FileKind)
  fileKind: FileKind;

  @ApiProperty({ description: 'Catégorie métier BDD_* (ex: BDD_PLANS)' })
  @IsString()
  @MaxLength(64)
  category: string;

  @ApiPropertyOptional({ description: 'Sous-catégorie métier (optionnel)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subCategory?: string;

  @ApiPropertyOptional({ description: 'BDD dossier (ex: BDD_ADMIN)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  bddCategory?: string;

  @ApiPropertyOptional({ description: 'Table dossier (ex: T_CONTRATS)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  tableName?: string;

  @ApiPropertyOptional({ description: 'Sous-dossier final (ex: DECOMPTE_1)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  subFolder?: string;

  @ApiPropertyOptional({ description: 'Chemin métier complet BDD/TABLE/SUBFOLDER' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  folderPath?: string;

  @ApiProperty({ enum: ['PROJECT', 'ZONE'] })
  @IsIn(['PROJECT', 'ZONE'])
  scope: 'PROJECT' | 'ZONE';

  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Obligatoire si scope=ZONE' })
  @IsOptional()
  @IsUUID()
  relatedZoneId?: string;
}
