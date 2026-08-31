import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

const url = process.env.AUTH_GRPC_URL ?? '0.0.0.0:50051';

export const authGrpcClientOptions = {
  transport: Transport.GRPC,
  name: 'AUTH_GRPC_CLIENT',
  options: {
    package: 'auth',
    protoPath: join(
      __dirname,
      '..',
      '..',
      'proto',
      'auth',
      'auth_service.proto',
    ),
    url,
    loader: { longs: Number },
  },
} as const;
