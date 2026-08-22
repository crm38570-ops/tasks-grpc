import { Body, Controller, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { map } from 'rxjs';
import { AxiosResponse } from 'axios';

@Controller('auth')
export class AuthProxyController {
  private readonly authServiceUrl: string;

  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.authServiceUrl = config.getOrThrow('AUTH_SERVICE_URL');
  }

  @Post('signup')
  signUp(@Body() body: unknown) {
    return this.http
      .post(`${this.authServiceUrl}/auth/signup`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }

  @Post('signin')
  signIn(@Body() body: unknown) {
    return this.http
      .post(`${this.authServiceUrl}/auth/signin`, body)
      .pipe(map((response: AxiosResponse<unknown>) => response.data));
  }
}
