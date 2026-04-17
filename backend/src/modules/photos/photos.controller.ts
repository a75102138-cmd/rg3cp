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
import { UserRole } from '@prisma/client';
import { ReviewActionDto } from '../../common/dto/review-action.dto';
import { JwtRequestUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { QueryPhotoDto } from './dto/query-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { UploadPhotoUnifiedDto } from './dto/upload-photo-unified.dto';
import { UploadJournalPhotosBodyDto } from './dto/upload-journal-photos.dto';
import { UploadProjectPhotosBodyDto } from './dto/upload-project-photos.dto';
import { UploadObservationPhotosBodyDto } from './dto/upload-observation-photos.dto';
import { UploadInterventionPhotosBodyDto } from './dto/upload-intervention-photos.dto';
import { UploadPathologyPhotosBodyDto } from './dto/upload-pathology-photos.dto';
import { UploadZonePhotosBodyDto } from './dto/upload-zone-photos.dto';
import { PhotosService } from './photos.service';

const PHOTO_UPLOAD_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB per file

@ApiTags('photos')
@ApiBearerAuth()
@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload/journal')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadJournal(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadJournalPhotosBodyDto,
  ) {
    return this.photosService.uploadJournalPhotos(files ?? [], body);
  }

  @Post('upload/project')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadProject(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadProjectPhotosBodyDto,
  ) {
    return this.photosService.uploadProjectPhotos(files ?? [], body);
  }

  @Post('upload/zone')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadZone(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadZonePhotosBodyDto,
  ) {
    return this.photosService.uploadZonePhotos(files ?? [], body);
  }

  @Post('upload/observation')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadObservation(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadObservationPhotosBodyDto,
  ) {
    return this.photosService.uploadObservationPhotos(files ?? [], body);
  }

  @Post('upload/pathology')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadPathology(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadPathologyPhotosBodyDto,
  ) {
    return this.photosService.uploadPathologyPhotos(files ?? [], body);
  }

  @Post('upload/intervention')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadIntervention(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadInterventionPhotosBodyDto,
  ) {
    return this.photosService.uploadInterventionPhotos(files ?? [], body);
  }

  @Post()
  @Roles(UserRole.USER)
  create(@Body() dto: CreatePhotoDto) {
    return this.photosService.create(dto);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: PHOTO_UPLOAD_MAX_FILE_SIZE },
    }),
  )
  @Roles(UserRole.USER)
  uploadUnified(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadPhotoUnifiedDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.photosService.uploadUnified(files ?? [], body, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryPhotoDto, @CurrentUser() user: JwtRequestUser) {
    return this.photosService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.photosService.findOne(id);
  }

  @Get(':id/download')
  download(@Param('id', ParseUUIDPipe) id: string) {
    return this.photosService.generateSignedUrl(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePhotoDto) {
    return this.photosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.photosService.remove(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.ACTEUR)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewActionDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.photosService.setReviewStatus(id, 'APPROVED', user.sub, body.remarks);
  }

  @Post(':id/reject')
  @Roles(UserRole.ACTEUR)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewActionDto,
    @CurrentUser() user: JwtRequestUser,
  ) {
    return this.photosService.setReviewStatus(id, 'REJECTED', user.sub, body.remarks);
  }
}
