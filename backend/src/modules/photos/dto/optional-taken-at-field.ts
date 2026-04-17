import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Champs optionnels réutilisables pour les body multipart d’upload photo. */
export class OptionalTakenAtField {
  @ApiPropertyOptional({
    description:
      'Date réelle de prise (ISO 8601). Si omis, EXIF DateTimeOriginal est utilisé quand présent.',
  })
  @IsOptional()
  @IsString()
  takenAt?: string;
}
