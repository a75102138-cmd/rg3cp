import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/** Non monté dans AppModule : le modèle Role n’existe plus dans le schéma Prisma. */
@Injectable()
export class RolesService {
  private unavailable(): never {
    throw new ServiceUnavailableException(
      'Rôles indisponibles : le schéma courant ne définit plus la table Role.',
    );
  }

  async create(_dto: CreateRoleDto) {
    this.unavailable();
  }

  async findAll(_query: QueryRoleDto) {
    this.unavailable();
  }

  async findOne(_id: string) {
    this.unavailable();
  }

  async update(_id: string, _dto: UpdateRoleDto) {
    this.unavailable();
  }

  async remove(_id: string) {
    this.unavailable();
  }
}
