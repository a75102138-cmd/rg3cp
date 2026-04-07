import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLogbookDto } from './create-logbook.dto';

/** Mise à jour partielle — le projet et le code ne sont pas modifiables. */
export class UpdateLogbookDto extends PartialType(OmitType(CreateLogbookDto, ['projectId'] as const)) {}
