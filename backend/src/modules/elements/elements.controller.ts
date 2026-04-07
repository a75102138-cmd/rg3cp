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
import { ElementsService } from './elements.service';
import { CreateElementDto } from './dto/create-element.dto';
import { QueryElementDto } from './dto/query-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';

@ApiTags('elements')
@ApiBearerAuth()
@Controller('elements')
export class ElementsController {
  constructor(private readonly elementsService: ElementsService) {}

  @Post()
  create(@Body() dto: CreateElementDto) {
    return this.elementsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryElementDto) {
    return this.elementsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.elementsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateElementDto) {
    return this.elementsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.elementsService.remove(id);
  }
}
