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
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { QueryInterventionDto } from './dto/query-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { InterventionsService } from './interventions.service';

@ApiTags('interventions')
@ApiBearerAuth()
@Controller('interventions')
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Post()
  create(@Body() dto: CreateInterventionDto) {
    return this.interventionsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryInterventionDto) {
    return this.interventionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.interventionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInterventionDto) {
    return this.interventionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.interventionsService.remove(id);
  }
}
