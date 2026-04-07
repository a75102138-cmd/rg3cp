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
import { CreateLabTestDto } from './dto/create-lab-test.dto';
import { QueryLabTestDto } from './dto/query-lab-test.dto';
import { UpdateLabTestDto } from './dto/update-lab-test.dto';
import { LabTestsService } from './lab-tests.service';

@ApiTags('lab-tests')
@ApiBearerAuth()
@Controller('lab-tests')
export class LabTestsController {
  constructor(private readonly labTestsService: LabTestsService) {}

  @Post()
  create(@Body() dto: CreateLabTestDto) {
    return this.labTestsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryLabTestDto) {
    return this.labTestsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.labTestsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLabTestDto) {
    return this.labTestsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.labTestsService.remove(id);
  }
}
