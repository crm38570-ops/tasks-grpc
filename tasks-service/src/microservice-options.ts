import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';

export const getMicroserviceOptions = (
  configService: ConfigService,
): MicroserviceOptions => {
  const protoDir = configService.get<string>('PROTO_ROOT') ?? join(__dirname, 'proto');
  const port = configService.get<number>('GRPC_PORT');

  return {
    transport: Transport.GRPC,
    options: {
      package: ['tasks', 'tasks_internal'],
      protoPath: [
        join(protoDir, 'tasks', 'tasks_service.proto'),
        join(protoDir, 'tasks_internal', 'tasks_internal_service.proto'),
      ],
      url: `0.0.0.0:${port}`,
      loader: {
        longs: Number,
      },
    },
  };
};
