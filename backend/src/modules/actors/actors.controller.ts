import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActorsService } from './actors.service';
import { CreateActorDto } from './dto/create-actor.dto';
import { QueryActorDto } from './dto/query-actor.dto';
import { UpdateActorProjectsDto } from './dto/update-actor-projects.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@ApiTags('actors')
@ApiBearerAuth()
@Controller('actors')
export class ActorsController {
  constructor(private readonly actorsService: ActorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create actor' })
  create(@Body() dto: CreateActorDto) {
    return this.actorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List actors' })
  findAll(@Query() query: QueryActorDto) {
    return this.actorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get actor by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.actorsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update actor' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateActorDto) {
    return this.actorsService.update(id, dto);
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'Assigned projects for actor' })
  findProjects(@Param('id', ParseUUIDPipe) id: string) {
    return this.actorsService.findAssignedProjects(id);
  }

  @Put(':id/projects')
  @ApiOperation({ summary: 'Update assigned projects for actor' })
  updateProjects(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActorProjectsDto,
  ) {
    return this.actorsService.updateAssignedProjects(id, dto.projectIds ?? []);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete actor' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.actorsService.remove(id);
  }
}
