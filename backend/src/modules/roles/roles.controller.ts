import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List roles' })
  findAll(@Query() query: QueryRoleDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.remove(id);
  }
}
