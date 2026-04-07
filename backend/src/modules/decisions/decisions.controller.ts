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
import { CreateDecisionDto } from './dto/create-decision.dto';
import { QueryDecisionDto } from './dto/query-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { DecisionsService } from './decisions.service';

@ApiTags('decisions')
@ApiBearerAuth()
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  create(@Body() dto: CreateDecisionDto) {
    return this.decisionsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDecisionDto) {
    return this.decisionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.decisionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDecisionDto) {
    return this.decisionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.decisionsService.remove(id);
  }
}
