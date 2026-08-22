import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';
import { AuthProxyModule } from './proxies/auth-proxy.module';
import { TasksProxyModule } from './proxies/tasks-proxy.module';
import { FilesProxyModule } from './proxies/files-proxy.module';

@Module({
  imports: [GatewayModule, AuthProxyModule, TasksProxyModule, FilesProxyModule],
})
export class AppModule {}
