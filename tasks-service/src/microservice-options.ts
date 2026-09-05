import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'node:path';
import * as dotenv from 'dotenv';
import { createGrpcServerOptions } from '@mcs/shared';

dotenv.config({ path: `.env.stage.${process.env.STAGE || 'dev'}` });

const port = Number(process.env.GRPC_PORT);
if (!port) {
  throw new Error('GRPC_PORT is required');
}
const protoDir = process.env.PROTO_ROOT ?? join(__dirname, 'proto');

const microserviceOptions: GrpcOptions = {
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

export default microserviceOptions;
