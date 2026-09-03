import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';

const port = Number(process.env.GRPC_PORT ?? 50052);

const protoDir = process.env.PROTO_ROOT ?? join(__dirname, 'proto');

const microserviceOptions: MicroserviceOptions = {
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

export default microserviceOptions;
