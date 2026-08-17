import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { FilesClientService } from './files-client.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'FILES_SERVICE',
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'files',
            protoPath: join(__dirname, '../proto/files/files_service.proto'),
            url: cfg.get('FILES_GRPC_URL') as string,
          },
        }),
      },
    ]),
  ],
  controllers: [FilesController],
  providers: [FilesClientService, FilesService],
  exports: [FilesClientService],
})
export class FilesModule {}
