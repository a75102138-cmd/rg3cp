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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMaterialDto } from './dto/create-material.dto';
import { QueryMaterialDto } from './dto/query-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryMaterialDto) {
    return this.materialsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMaterialDto) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialsService.remove(id);
  }
}
