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
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { ReviewActionDto } from '../../common/dto/review-action.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtRequestUser } from '../auth/auth.types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentUnifiedDto } from './dto/upload-document-unified.dto';
import { UploadProjectDocumentBodyDto } from './dto/upload-project-document.dto';
import { UploadObservationDocumentBodyDto } from './dto/upload-observation-document.dto';
import { UploadDecisionDocumentBodyDto } from './dto/upload-decision-document.dto';
import { UploadInterventionDocumentBodyDto } from './dto/upload-intervention-document.dto';
import { UploadPathologyDocumentBodyDto } from './dto/upload-pathology-document.dto';
import { UploadZoneDocumentBodyDto } from './dto/upload-zone-document.dto';
import { DocumentsService } from './documents.service';

const DOCUMENT_UPLOAD_MAX_FILES = 50;
const DOCUMENT_UPLOAD_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB per file

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(UserRole.USER)
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadUnified(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadDocumentUnifiedDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.documentsService.uploadUnified(files ?? [], body, user.sub);
  }

  @Post('upload/project')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadProject(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadProjectDocumentBodyDto,
  ) {
    return this.documentsService.uploadProjectDocuments(files, body);
  }

  @Post('upload/zone')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadZone(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadZoneDocumentBodyDto,
  ) {
    return this.documentsService.uploadZoneDocuments(files, body);
  }

  @Post('upload/pathology')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadPathology(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadPathologyDocumentBodyDto,
  ) {
    return this.documentsService.uploadPathologyDocuments(files, body);
  }

  @Post('upload/observation')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadObservation(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadObservationDocumentBodyDto,
  ) {
    return this.documentsService.uploadObservationDocuments(files, body);
  }

  @Post('upload/decision')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadDecision(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadDecisionDocumentBodyDto,
  ) {
    return this.documentsService.uploadDecisionDocuments(files, body);
  }

  @Post('upload/intervention')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', DOCUMENT_UPLOAD_MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: DOCUMENT_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadIntervention(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadInterventionDocumentBodyDto,
  ) {
    return this.documentsService.uploadInterventionDocuments(files, body);
  }

  @Get()
  findAll(@Query() query: QueryDocumentDto, @CurrentUser() user: JwtRequestUser) {
    return this.documentsService.findAll(query, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ACTEUR)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewActionDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.documentsService.setReviewStatus(id, 'APPROVED', user.sub, body.remarks);
  }

  @Post(':id/reject')
  @Roles(UserRole.ACTEUR)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewActionDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.documentsService.setReviewStatus(id, 'REJECTED', user.sub, body.remarks);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  download(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.generateSignedUrl(id);
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
