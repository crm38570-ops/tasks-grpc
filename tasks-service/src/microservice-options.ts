import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { createGrpcServerOptions } from '@mcs/shared';

export const getMicroserviceOptions = (
  configService: ConfigService,
): MicroserviceOptions => {
  const protoDir =
    configService.get<string>('PROTO_ROOT') ?? join(__dirname, 'proto');
  const port = configService.get<number>('GRPC_PORT');
  if (port === undefined) {
    throw new Error('GRPC_PORT is required');
  }

  return {
    transport: Transport.GRPC,
    options: createGrpcServerOptions({
      package: ['tasks', 'tasks_internal'],
      protoPath: [
        join(protoDir, 'tasks', 'tasks_service.proto'),
        join(protoDir, 'tasks_internal', 'tasks_internal_service.proto'),
      ],
      port,
    }),
  };
};
