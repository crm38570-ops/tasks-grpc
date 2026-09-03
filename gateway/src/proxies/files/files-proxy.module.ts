import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { FilesProxyController } from './files-proxy.controller';
import { FilesProxyService } from './files-proxy.service';
import { filesGrpcClientOptions } from './options/grpc-client.options';

@Module({
  imports: [ConfigModule],
  controllers: [FilesProxyController],
  providers: [
    FilesProxyService,
    {
      provide: 'FILES_GRPC_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create(filesGrpcClientOptions(configService)),
    },
  ],
})
export class FilesProxyModule {}
