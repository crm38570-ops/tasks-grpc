import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';

const port = Number(process.env.GRPC_PORT ?? 50052);
const service = 'tasks';

const microserviceOptions: MicroserviceOptions = {
  transport: Transport.GRPC,
  options: {
    package: service,
    protoPath:
      process.env.PROTO_PATH ??
      join(__dirname, 'proto', service, `${service}_service.proto`),
    url: `0.0.0.0:${port}`,
    loader: {
      longs: Number,
    },
  },
};

export default microserviceOptions;
