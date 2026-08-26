import { Body, Controller, Logger, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';

@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger('AuthProxyController', {
    timestamp: true,
  });
  private readonly authServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.authServiceUrl = config.getOrThrow('AUTH_SERVICE_URL');
  }

  @Post('signup')
  signUp(@Body() body: unknown) {
    this.logger.verbose('Sign up request received');
    return this.http
      .post(`${this.authServiceUrl}/auth/signup`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Post('signin')
  signIn(@Body() body: unknown) {
    this.logger.verbose('Sign in request received');
    return this.http
      .post(`${this.authServiceUrl}/auth/signin`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
