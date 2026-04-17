import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { OptionalTakenAtField } from './optional-taken-at-field';

export class UploadPhotoUnifiedDto extends OptionalTakenAtField {
  @ApiProperty({ description: 'BDD category (folder root)', example: 'BDD_MEDIA' })
  @IsString()
  @MaxLength(64)
  bddCategory: string;

  @ApiProperty({ description: 'Table folder', example: 'T_REPORTAGES_PHOTO' })
  @IsString()
  @MaxLength(128)
  tableName: string;

  @ApiProperty({ description: 'Sub folder', example: 'PHOTOS_SUIVI' })
  @IsString()
  @MaxLength(128)
  subFolder: string;

  @ApiPropertyOptional({ description: 'Full folder path (auto-derived if omitted)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  folderPath?: string;

  @ApiProperty({ description: 'Catégorie métier BDD_* (ex: BDD_MEDIA)' })
  @IsString()
  @MaxLength(64)
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  subCategory?: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;
}
