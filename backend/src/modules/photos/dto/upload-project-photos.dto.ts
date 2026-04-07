import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PROJECT_PHOTO_TYPES } from './project-photo-type';

export class UploadProjectPhotosBodyDto {
  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ enum: PROJECT_PHOTO_TYPES })
  @IsIn([...PROJECT_PHOTO_TYPES])
  photoType: string;

  /** Uniquement si un seul fichier : titre affiché (sinon dérivé du nom de fichier). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  /** Uniquement si un seul fichier : légende optionnelle. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string;
}
