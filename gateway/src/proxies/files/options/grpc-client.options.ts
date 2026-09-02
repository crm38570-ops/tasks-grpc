import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

const url = process.env.FILES_GRPC_URL ?? '0.0.0.0:50051';

export const filesGrpcClientOptions = {
  transport: Transport.GRPC,
  name: 'FILES_GRPC_CLIENT',
  options: {
    package: 'files',
    protoPath: join(
      __dirname,
      '..',
      '..',
      '..',
      'proto',
      'files',
      'files_service.proto',
    ),
    url,
    loader: { longs: Number },
  },
} as const;
