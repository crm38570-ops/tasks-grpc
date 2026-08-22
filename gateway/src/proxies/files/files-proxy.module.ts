import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FilesProxyController } from './files-proxy.controller';

@Module({
  imports: [HttpModule],
  controllers: [FilesProxyController],
})
export class FilesProxyModule {}
