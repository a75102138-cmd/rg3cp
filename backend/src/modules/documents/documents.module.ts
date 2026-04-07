import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
