import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

export const tasksInternalGrpcClientOptions = (configService: ConfigService) =>
  ({
    transport: Transport.GRPC,
    name: 'TASKS_INTERNAL_GRPC_CLIENT',
    options: {
      package: 'tasks_internal',
      protoPath: join(
        __dirname,
        '..',
        '..',
        '..',
        'proto',
        'tasks_internal',
        'tasks_internal_service.proto',
      ),
      url: configService.getOrThrow<string>('TASKS_GRPC_URL'),
      loader: { longs: Number },
    },
  }) as const;
