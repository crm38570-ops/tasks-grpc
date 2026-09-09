import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { AuthProxyController } from './auth-proxy.controller';
import { AuthProxyService } from './auth-proxy.service';
import { authGrpcClientOptions } from './options/grpc-client.options';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [ConfigModule, PassportModule],
  controllers: [AuthProxyController],
  providers: [
    AuthProxyService,
    JwtStrategy,
    {
      provide: 'AUTH_GRPC_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create(authGrpcClientOptions(configService)),
    },
  ],
})
export class AuthProxyModule {}
