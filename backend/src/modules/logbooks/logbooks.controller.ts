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
import { CreateLogbookDto } from './dto/create-logbook.dto';
import { QueryLogbookDto } from './dto/query-logbook.dto';
import { UpdateLogbookDto } from './dto/update-logbook.dto';
import { LogbooksService } from './logbooks.service';

@ApiTags('logbooks')
@ApiBearerAuth()
@Controller('logbooks')
export class LogbooksController {
  constructor(private readonly logbooksService: LogbooksService) {}

  @Post()
  create(@Body() dto: CreateLogbookDto) {
    return this.logbooksService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryLogbookDto) {
    return this.logbooksService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.logbooksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLogbookDto) {
    return this.logbooksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.logbooksService.remove(id);
  }
}
