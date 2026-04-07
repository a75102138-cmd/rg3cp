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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreatePathologyDto } from './dto/create-pathology.dto';
import { QueryPathologyDto } from './dto/query-pathology.dto';
import { UpdatePathologyDto } from './dto/update-pathology.dto';
import { PathologiesService } from './pathologies.service';

@ApiTags('pathologies')
@ApiBearerAuth()
@Controller('pathologies')
export class PathologiesController {
  constructor(private readonly pathologiesService: PathologiesService) {}

  @Post()
  create(@Body() dto: CreatePathologyDto) {
    return this.pathologiesService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryPathologyDto) {
    return this.pathologiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pathologiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePathologyDto) {
    return this.pathologiesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pathologiesService.remove(id);
  }
}
