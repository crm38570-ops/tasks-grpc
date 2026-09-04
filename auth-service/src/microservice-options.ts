import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import { createGrpcServerOptions } from '@mcs/shared';

const port = Number(process.env.GRPC_PORT ?? 50051);
const service = 'auth';

const microserviceOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: createGrpcServerOptions({
    package: service,
    protoPath:
      process.env.PROTO_PATH ??
      join(__dirname, 'proto', service, `${service}_service.proto`),
    port,
  }),
};

export default microserviceOptions;
