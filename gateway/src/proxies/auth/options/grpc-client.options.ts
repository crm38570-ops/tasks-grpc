import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

export const authGrpcClientOptions = (configService: ConfigService) =>
  ({
    transport: Transport.GRPC,
    name: 'AUTH_GRPC_CLIENT',
    options: {
      package: 'auth',
      protoPath: join(
        __dirname,
        '..',
        '..',
        '..',
        'proto',
        'auth',
        'auth_service.proto',
      ),
      url: configService.getOrThrow<string>('AUTH_GRPC_URL'),
      loader: { longs: Number },
    },
  }) as const;
