import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

const url = process.env.TASKS_GRPC_URL ?? '0.0.0.0:50052';

export const tasksGrpcClientOptions = {
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
    url,
    loader: { longs: Number },
  },
} as const;
