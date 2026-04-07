import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateElementDto } from './create-element.dto';

/** Mise à jour — la zone parente ne change pas via cette API. */
export class UpdateElementDto extends PartialType(OmitType(CreateElementDto, ['zoneId'] as const)) {}
