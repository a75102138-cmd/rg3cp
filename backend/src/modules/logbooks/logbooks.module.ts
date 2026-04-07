import { Module } from '@nestjs/common';
import { LogbooksController } from './logbooks.controller';
import { LogbooksService } from './logbooks.service';

@Module({
  controllers: [LogbooksController],
  providers: [LogbooksService],
  exports: [LogbooksService],
})
export class LogbooksModule {}
