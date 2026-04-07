import { Module } from '@nestjs/common';
import { PathologiesController } from './pathologies.controller';
import { PathologiesService } from './pathologies.service';

@Module({
  controllers: [PathologiesController],
  providers: [PathologiesService],
  exports: [PathologiesService],
})
export class PathologiesModule {}
