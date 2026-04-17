import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtRequestUser } from '../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserProjectsDto } from './dto/update-user-projects.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un utilisateur (ADMIN)' })
  create(@Body() dto: CreateUserDto) {
    if (dto.role === UserRole.USER && !dto.defaultValidatorUserId) {
      throw new BadRequestException('defaultValidatorUserId est requis pour créer un utilisateur.');
    }
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste utilisateurs (ADMIN)' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail utilisateur (ADMIN)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier utilisateur (ADMIN)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Get(':id/projects')
  @Roles(UserRole.ADMIN, UserRole.ACTEUR, UserRole.USER)
  @ApiOperation({ summary: 'Projets assignés à un utilisateur (ADMIN)' })
  findProjects(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() currentUser: JwtRequestUser,
  ) {
    if (currentUser.role !== UserRole.ADMIN && currentUser.sub !== id) {
      throw new ForbiddenException('Accès refusé à ces projets.');
    }
    return this.usersService.findAssignedProjects(id);
  }

  @Put(':id/projects')
  @ApiOperation({ summary: 'Mettre à jour les projets assignés à un utilisateur (ADMIN)' })
  updateProjects(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserProjectsDto,
  ) {
    return this.usersService.updateAssignedProjects(id, dto.projectIds ?? []);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer utilisateur (ADMIN)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
