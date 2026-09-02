import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

const url = process.env.TASKS_GRPC_URL ?? '0.0.0.0:50052';

export const tasksInternalGrpcClientOptions = {
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
    url,
    loader: { longs: Number },
  },
} as const;
