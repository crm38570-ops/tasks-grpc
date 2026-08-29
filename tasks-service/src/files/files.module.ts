import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { FilesClientService } from './files-client.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TasksModule,
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: 'FILES_SERVICE',
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'files',
            protoPath:
              process.env.PROTO_PATH ??
              join(__dirname, '../proto/files/files_service.proto'),
            url: cfg.get('FILES_GRPC_URL') as string,
            loader: {
              longs: Number,
            },
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
