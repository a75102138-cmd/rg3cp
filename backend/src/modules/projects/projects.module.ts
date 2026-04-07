import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
