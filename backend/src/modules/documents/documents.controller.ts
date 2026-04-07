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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadProjectDocumentBodyDto } from './dto/upload-project-document.dto';
import { UploadObservationDocumentBodyDto } from './dto/upload-observation-document.dto';
import { UploadDecisionDocumentBodyDto } from './dto/upload-decision-document.dto';
import { UploadInterventionDocumentBodyDto } from './dto/upload-intervention-document.dto';
import { UploadPathologyDocumentBodyDto } from './dto/upload-pathology-document.dto';
import { UploadZoneDocumentBodyDto } from './dto/upload-zone-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Post('upload/project')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadProject(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadProjectDocumentBodyDto,
  ) {
    return this.documentsService.uploadProjectDocuments(files, body);
  }

  @Post('upload/zone')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadZone(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadZoneDocumentBodyDto,
  ) {
    return this.documentsService.uploadZoneDocuments(files, body);
  }

  @Post('upload/pathology')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadPathology(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadPathologyDocumentBodyDto,
  ) {
    return this.documentsService.uploadPathologyDocuments(files, body);
  }

  @Post('upload/observation')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadObservation(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadObservationDocumentBodyDto,
  ) {
    return this.documentsService.uploadObservationDocuments(files, body);
  }

  @Post('upload/decision')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadDecision(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadDecisionDocumentBodyDto,
  ) {
    return this.documentsService.uploadDecisionDocuments(files, body);
  }

  @Post('upload/intervention')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  uploadIntervention(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadInterventionDocumentBodyDto,
  ) {
    return this.documentsService.uploadInterventionDocuments(files, body);
  }

  @Get()
  findAll(@Query() query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.remove(id);
  }
}
