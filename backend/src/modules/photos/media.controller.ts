import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtRequestUser } from '../auth/auth.types';
import { QueryPhotoDto } from './dto/query-photo.dto';
import { PhotosService } from './photos.service';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(private readonly photosService: PhotosService) {}

  @Get()
  findAll(@Query() query: QueryPhotoDto, @CurrentUser() user: JwtRequestUser) {
    return this.photosService.findAll(query, user);
  }
}
