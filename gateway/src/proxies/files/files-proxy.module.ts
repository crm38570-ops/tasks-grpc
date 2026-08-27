import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FilesProxyController } from './files-proxy.controller';
import { FilesProxyService } from './files-proxy.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [FilesProxyController],
  providers: [FilesProxyService],
})
export class FilesProxyModule {}
