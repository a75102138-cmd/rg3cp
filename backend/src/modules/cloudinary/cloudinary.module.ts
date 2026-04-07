import { Module } from '@nestjs/common';
import { CloudinaryPathBuilderService } from './cloudinary-path-builder.service';
import { CloudinaryUploadService } from './cloudinary-upload.service';

@Module({
  providers: [CloudinaryPathBuilderService, CloudinaryUploadService],
  exports: [CloudinaryPathBuilderService, CloudinaryUploadService],
})
export class CloudinaryModule {}
