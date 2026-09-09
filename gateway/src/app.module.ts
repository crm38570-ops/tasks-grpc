import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GatewayModule } from './gateway/gateway.module';
import { AuthProxyModule } from './auth/auth-proxy.module';
import { TasksProxyModule } from './tasks/tasks-proxy.module';
import { configValidationSchema } from './config.schema';
import { APP_FILTER } from '@nestjs/core';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.stage.${process.env.STAGE}`,
      validationSchema: configValidationSchema,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
      }),
    }),
    GatewayModule,
    AuthProxyModule,
    TasksProxyModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: RpcExceptionFilter }],
})
export class AppModule {}
