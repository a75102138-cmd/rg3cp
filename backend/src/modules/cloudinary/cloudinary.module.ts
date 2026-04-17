import { Module } from '@nestjs/common';
import { B2UploadService } from './b2-upload.service';
import { CloudinaryPathBuilderService } from './cloudinary-path-builder.service';
import { CloudinaryUploadService } from './cloudinary-upload.service';

@Module({
  providers: [CloudinaryPathBuilderService, CloudinaryUploadService, B2UploadService],
  exports: [CloudinaryPathBuilderService, CloudinaryUploadService, B2UploadService],
})
export class CloudinaryModule {}
