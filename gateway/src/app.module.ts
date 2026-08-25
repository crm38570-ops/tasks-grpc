import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { GatewayModule } from './gateway/gateway.module';
import { AuthProxyModule } from './proxies/auth/auth-proxy.module';
import { TasksProxyModule } from './proxies/tasks/tasks-proxy.module';
import { FilesProxyModule } from './proxies/files/files-proxy.module';
import { configValidationSchema } from './config.schema';
import { APP_FILTER } from '@nestjs/core';
import { AxiosExceptionFilter } from './filters/axios-exception.filter';

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
    FilesProxyModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AxiosExceptionFilter }],
})
export class AppModule {}
