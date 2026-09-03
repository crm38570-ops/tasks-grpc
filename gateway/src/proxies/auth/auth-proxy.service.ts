import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthServiceClient } from '../../proto/auth/generated/auth_service';
import type { SignUpDto, SignInDto } from './dto';

@Injectable()
export class AuthProxyService implements OnModuleInit {
  private readonly logger = new Logger('AuthProxyService', {
    timestamp: true,
  });
  private authService!: AuthServiceClient;

  constructor(
    @Inject('AUTH_GRPC_CLIENT') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  async signUp(dto: SignUpDto): Promise<unknown> {
    this.logger.verbose(`Sign up request: "${dto.username}"`);
    return lastValueFrom(this.authService.signUp(dto));
  }

  async signIn(dto: SignInDto): Promise<unknown> {
    this.logger.verbose(`Sign in request: "${dto.username}"`);
    return lastValueFrom(this.authService.signIn(dto));
  }
}
