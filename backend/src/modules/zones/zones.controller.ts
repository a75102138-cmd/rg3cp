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
import { CreateZoneDto } from './dto/create-zone.dto';
import { QueryZoneDto } from './dto/query-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@ApiBearerAuth()
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryZoneDto) {
    return this.zonesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.remove(id);
  }
}
