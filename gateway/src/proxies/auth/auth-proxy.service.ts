import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { AuthServiceClient } from '../../proto/auth/generated/auth_service';
import type { SignUpDto, SignInDto } from './dto';
import { withDeadline } from '../shared/with-deadline';

@Injectable()
export class AuthProxyService implements OnModuleInit {
  private readonly logger = new Logger('AuthProxyService', {
    timestamp: true,
  });
  private readonly grpcTimeoutMs: number;
  private authService!: AuthServiceClient;

  constructor(
    @Inject('AUTH_GRPC_CLIENT') private readonly client: ClientGrpc,
    configService: ConfigService,
  ) {
    this.grpcTimeoutMs = configService.getOrThrow<number>('GRPC_TIMEOUT_MS');
  }

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>('AuthService');
  }

  async signUp(dto: SignUpDto): Promise<unknown> {
    this.logger.verbose(`Sign up request: "${dto.username}"`);
    return lastValueFrom(
      withDeadline(this.authService.signUp(dto), this.grpcTimeoutMs),
    );
  }

  async signIn(dto: SignInDto): Promise<unknown> {
    this.logger.verbose(`Sign in request: "${dto.username}"`);
    return lastValueFrom(
      withDeadline(this.authService.signIn(dto), this.grpcTimeoutMs),
    );
  }
}
