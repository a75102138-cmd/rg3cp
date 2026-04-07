import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/** Mise à jour partielle — pas de code ni d’identifiants système côté client. */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
