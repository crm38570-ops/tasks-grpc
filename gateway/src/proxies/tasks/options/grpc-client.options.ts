import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

export const tasksGrpcClientOptions = (configService: ConfigService) =>
  ({
    transport: Transport.GRPC,
    name: 'TASKS_GRPC_CLIENT',
    options: {
      package: 'tasks',
      protoPath: join(
        __dirname,
        '..',
        '..',
        '..',
        'proto',
        'tasks',
        'tasks_service.proto',
      ),
      url: configService.getOrThrow<string>('TASKS_GRPC_URL'),
      loader: { longs: Number },
    },
  }) as const;
