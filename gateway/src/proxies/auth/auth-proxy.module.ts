import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthProxyController } from './auth-proxy.controller';
import { ClientProxyFactory } from '@nestjs/microservices';
import { authGrpcClientOptions } from './options/grpc-client.options';

@Module({
  imports: [ConfigModule],
  controllers: [AuthProxyController],
  providers: [
    {
      provide: 'AUTH_GRPC_CLIENT',
      useFactory: () => ClientProxyFactory.create(authGrpcClientOptions),
    },
  ],
})
export class AuthProxyModule {}
