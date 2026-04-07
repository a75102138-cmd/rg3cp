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
import { CreateRiskDto } from './dto/create-risk.dto';
import { QueryRiskDto } from './dto/query-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RisksService } from './risks.service';

@ApiTags('risks')
@ApiBearerAuth()
@Controller('risks')
export class RisksController {
  constructor(private readonly risksService: RisksService) {}

  @Post()
  create(@Body() dto: CreateRiskDto) {
    return this.risksService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryRiskDto) {
    return this.risksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.risksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRiskDto) {
    return this.risksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.risksService.remove(id);
  }
}
