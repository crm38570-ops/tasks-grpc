import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
      useFactory: () => ClientProxyFactory.create(filesGrpcClientOptions),
    },
  ],
})
export class FilesProxyModule {}
