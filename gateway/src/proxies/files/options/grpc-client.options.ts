import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { join } from 'node:path';

export const filesGrpcClientOptions = (configService: ConfigService) =>
  ({
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
      url: configService.getOrThrow<string>('FILES_GRPC_URL'),
      loader: { longs: Number },
    },
  }) as const;
