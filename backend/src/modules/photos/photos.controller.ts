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
import { CreatePhotoDto } from './dto/create-photo.dto';
import { QueryPhotoDto } from './dto/query-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { UploadJournalPhotosBodyDto } from './dto/upload-journal-photos.dto';
import { UploadProjectPhotosBodyDto } from './dto/upload-project-photos.dto';
import { UploadObservationPhotosBodyDto } from './dto/upload-observation-photos.dto';
import { UploadInterventionPhotosBodyDto } from './dto/upload-intervention-photos.dto';
import { UploadPathologyPhotosBodyDto } from './dto/upload-pathology-photos.dto';
import { UploadZonePhotosBodyDto } from './dto/upload-zone-photos.dto';
import { PhotosService } from './photos.service';

@ApiTags('photos')
@ApiBearerAuth()
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload/journal')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadJournal(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadJournalPhotosBodyDto,
  ) {
    return this.photosService.uploadJournalPhotos(files ?? [], body.projectId, body.logbookId);
  }

  @Post('upload/project')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadProject(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadProjectPhotosBodyDto,
  ) {
    return this.photosService.uploadProjectPhotos(files ?? [], body);
  }

  @Post('upload/zone')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadZone(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadZonePhotosBodyDto,
  ) {
    return this.photosService.uploadZonePhotos(files ?? [], body);
  }

  @Post('upload/observation')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadObservation(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadObservationPhotosBodyDto,
  ) {
    return this.photosService.uploadObservationPhotos(files ?? [], body);
  }

  @Post('upload/pathology')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadPathology(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadPathologyPhotosBodyDto,
  ) {
    return this.photosService.uploadPathologyPhotos(files ?? [], body);
  }

  @Post('upload/intervention')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 25, {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  uploadIntervention(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadInterventionPhotosBodyDto,
  ) {
    return this.photosService.uploadInterventionPhotos(files ?? [], body);
  }

  @Post()
  create(@Body() dto: CreatePhotoDto) {
    return this.photosService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryPhotoDto) {
    return this.photosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.photosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePhotoDto) {
    return this.photosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.photosService.remove(id);
  }
}
