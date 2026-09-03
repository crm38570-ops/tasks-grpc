import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { AuthProxyController } from './auth-proxy.controller';
import { AuthProxyService } from './auth-proxy.service';
import { authGrpcClientOptions } from './options/grpc-client.options';

@Module({
  imports: [ConfigModule],
  controllers: [AuthProxyController],
  providers: [
    AuthProxyService,
    {
      provide: 'AUTH_GRPC_CLIENT',
      useFactory: () => ClientProxyFactory.create(authGrpcClientOptions),
    },
  ],
})
export class AuthProxyModule {}
