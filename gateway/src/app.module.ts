import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';
import { AuthProxyModule } from './proxies/auth/auth-proxy.module';
import { TasksProxyModule } from './proxies/tasks/tasks-proxy.module';
import { FilesProxyModule } from './proxies/files/files-proxy.module';

@Module({
  imports: [GatewayModule, AuthProxyModule, TasksProxyModule, FilesProxyModule],
})
export class AppModule {}
