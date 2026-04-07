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
import { CreateObservationDto } from './dto/create-observation.dto';
import { QueryObservationDto } from './dto/query-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { ObservationsService } from './observations.service';

@ApiTags('observations')
@ApiBearerAuth()
@Controller('observations')
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  create(@Body() dto: CreateObservationDto) {
    return this.observationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryObservationDto) {
    return this.observationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.observationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateObservationDto) {
    return this.observationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.observationsService.remove(id);
  }
}
