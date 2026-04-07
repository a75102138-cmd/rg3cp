import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
