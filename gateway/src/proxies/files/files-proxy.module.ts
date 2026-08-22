import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FilesProxyController } from './files-proxy.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [FilesProxyController],
})
export class FilesProxyModule {}
