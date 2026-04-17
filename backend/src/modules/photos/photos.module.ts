import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MediaController } from './media.controller';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [PhotosController, MediaController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}
